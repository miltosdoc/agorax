"""
Configuration management for the Ballot Validation Service.
Load settings from environment variables with sensible defaults.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )
    
    # Security
    SALT_KEY: str = "CHANGE_ME_IN_PRODUCTION_abc123xyz"
    
    # Database
    DATABASE_URL: str = "sqlite:///./ballot_votes.db"
    
    # Allowed government signers for PAdES validation
    # These are the CN (Common Name) values from the signing certificates
    ALLOWED_SIGNERS: List[str] = [
        "Hellenic Republic",
        "HELLENIC REPUBLIC", 
        "Ministry of Digital Governance",
        "MINISTRY OF DIGITAL GOVERNANCE",
        "Ελληνική Δημοκρατία",
        "Υπουργείο Ψηφιακής Διακυβέρνησης",
        "APOSTILLE",  # Gov.gr signing service
    ]
    
    # Application settings
    DEBUG: bool = False
    API_PREFIX: str = "/api/ballot"
    
    # Vote update policy
    ALLOW_VOTE_UPDATE: bool = False


# Singleton settings instance
settings = Settings()
