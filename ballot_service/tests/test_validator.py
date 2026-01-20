"""
Unit tests for BallotValidator.

Run with: python -m pytest tests/ -v
"""
import pytest
import hashlib
from unittest.mock import Mock, patch, MagicMock
from io import BytesIO

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from validator import BallotValidator, ValidationResult, RejectionReason
from models import Vote
from config import settings


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    db = Mock()
    db.query.return_value.filter.return_value.first.return_value = None
    return db


@pytest.fixture
def validator(mock_db):
    """Create a BallotValidator with mock database."""
    return BallotValidator(mock_db)


class TestAFMExtraction:
    """Tests for AFM extraction from text."""
    
    def test_extract_afm_standard_format(self, validator):
        text = "Name: John Doe\nAFM: 123456789\nAddress: Athens"
        afm = validator._extract_afm(text)
        assert afm == "123456789"
    
    def test_extract_afm_greek_format(self, validator):
        text = "Ονομα: Γιάννης\nΑΦΜ: 987654321\nΔιεύθυνση: Αθήνα"
        afm = validator._extract_afm(text)
        assert afm == "987654321"
    
    def test_extract_afm_with_dots(self, validator):
        text = "Α.Φ.Μ.: 111222333"
        afm = validator._extract_afm(text)
        assert afm == "111222333"
    
    def test_extract_afm_not_found(self, validator):
        text = "No tax ID in this document"
        afm = validator._extract_afm(text)
        assert afm is None
    
    def test_extract_afm_invalid_length(self, validator):
        text = "AFM: 12345"  # Only 5 digits
        afm = validator._extract_afm(text)
        assert afm is None


class TestVoteChoiceExtraction:
    """Tests for vote choice extraction from text."""
    
    def test_extract_vote_choice_english(self, validator):
        text = "I vote for [Option A] in this election"
        choice = validator._extract_vote_choice(text)
        assert choice == "Option A"
    
    def test_extract_vote_choice_greek(self, validator):
        text = "Εγώ ψηφίζω [Επιλογή Β] σε αυτή την ψηφοφορία"
        choice = validator._extract_vote_choice(text)
        assert choice == "Επιλογή Β"
    
    def test_extract_vote_choice_with_spaces(self, validator):
        text = "vote for [  Multiple Word Choice  ]"
        choice = validator._extract_vote_choice(text)
        assert choice == "Multiple Word Choice"
    
    def test_extract_vote_choice_not_found(self, validator):
        text = "This declaration has no vote"
        choice = validator._extract_vote_choice(text)
        assert choice is None


class TestVoterHashing:
    """Tests for voter ID hashing."""
    
    def test_hash_voter_id_consistency(self, validator):
        afm = "123456789"
        hash1 = validator._hash_voter_id(afm)
        hash2 = validator._hash_voter_id(afm)
        assert hash1 == hash2
    
    def test_hash_voter_id_different_afms(self, validator):
        hash1 = validator._hash_voter_id("123456789")
        hash2 = validator._hash_voter_id("987654321")
        assert hash1 != hash2
    
    def test_hash_voter_id_format(self, validator):
        afm = "123456789"
        hash_result = validator._hash_voter_id(afm)
        assert len(hash_result) == 64  # SHA256 produces 64 hex characters
        assert all(c in '0123456789abcdef' for c in hash_result)


class TestFileHashing:
    """Tests for file hash calculation."""
    
    def test_file_hash_consistency(self, validator):
        content = b"test pdf content"
        hash1 = validator._calculate_file_hash(content)
        hash2 = validator._calculate_file_hash(content)
        assert hash1 == hash2
    
    def test_file_hash_different_content(self, validator):
        hash1 = validator._calculate_file_hash(b"content 1")
        hash2 = validator._calculate_file_hash(b"content 2")
        assert hash1 != hash2


class TestGate2Uniqueness:
    """Tests for Gate 2: File uniqueness check."""
    
    def test_unique_file_passes(self, mock_db):
        mock_db.query.return_value.filter.return_value.first.return_value = None
        validator = BallotValidator(mock_db)
        
        result = validator._gate2_check_uniqueness("abc123hash")
        
        assert result.success is True
    
    def test_duplicate_file_fails(self, mock_db):
        # Simulate existing vote with same file hash
        mock_db.query.return_value.filter.return_value.first.return_value = Mock()
        validator = BallotValidator(mock_db)
        
        result = validator._gate2_check_uniqueness("abc123hash")
        
        assert result.success is False
        assert result.rejection_reason == RejectionReason.DUPLICATE_FILE


class TestGate3Token:
    """Tests for Gate 3: Token verification."""
    
    def test_token_found_passes(self, validator):
        text = "Declaration content with Security Token: abc-123-xyz"
        result = validator._gate3_verify_token(text, "abc-123-xyz")
        assert result.success is True
    
    def test_token_not_found_fails(self, validator):
        text = "Declaration content without the token"
        result = validator._gate3_verify_token(text, "abc-123-xyz")
        assert result.success is False
        assert result.rejection_reason == RejectionReason.TOKEN_NOT_FOUND
    
    def test_empty_token_fails(self, validator):
        text = "Some declaration text"
        result = validator._gate3_verify_token(text, "")
        assert result.success is False
        assert result.rejection_reason == RejectionReason.INVALID_TOKEN


class TestGate4Identity:
    """Tests for Gate 4: Voter identity verification."""
    
    def test_new_voter_passes(self, mock_db):
        mock_db.query.return_value.filter.return_value.first.return_value = None
        validator = BallotValidator(mock_db)
        
        text = "AFM: 123456789"
        result = validator._gate4_verify_identity(text, "poll_2024")
        
        assert result.success is True
        assert result.voter_hash is not None
    
    def test_afm_not_found_fails(self, mock_db):
        validator = BallotValidator(mock_db)
        
        text = "No tax ID here"
        result = validator._gate4_verify_identity(text, "poll_2024")
        
        assert result.success is False
        assert result.rejection_reason == RejectionReason.AFM_NOT_FOUND
    
    def test_already_voted_fails(self, mock_db):
        # Simulate existing vote from same voter
        mock_db.query.return_value.filter.return_value.first.return_value = Mock()
        validator = BallotValidator(mock_db)
        validator.allow_vote_update = False
        
        text = "AFM: 123456789"
        result = validator._gate4_verify_identity(text, "poll_2024")
        
        assert result.success is False
        assert result.rejection_reason == RejectionReason.ALREADY_VOTED


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
