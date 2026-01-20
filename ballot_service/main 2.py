"""
FastAPI Application for Gov.gr Ballot Box System.

Provides REST API endpoints for:
- Ballot validation (PDF upload)
- Frontend instructions
- Health checks
"""
import nest_asyncio
nest_asyncio.apply()

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

from sqlalchemy.orm import Session

from config import settings
from database import get_db, init_db
from validator import BallotValidator, ValidationResult, RejectionReason


# Initialize FastAPI app
app = FastAPI(
    title="Gov.gr Ballot Box API",
    description="Secure voting system using government-issued Solemn Declarations",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models for API responses
class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str


class InstructionsResponse(BaseModel):
    link: str
    template_text: str
    poll_token: str


class ValidationResponse(BaseModel):
    success: bool
    message: str
    rejection_reason: Optional[str] = None
    vote_choice: Optional[str] = None
    signer_name: Optional[str] = None
    voter_hash: Optional[str] = None


class PollTokenRequest(BaseModel):
    poll_id: str


class PollTokenResponse(BaseModel):
    poll_id: str
    poll_token: str
    expires_at: str


# Store active poll tokens (in production, use Redis or database)
active_poll_tokens: dict[str, dict] = {}


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    init_db()


@app.get(f"{settings.API_PREFIX}/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.
    
    Returns service status for monitoring and load balancers.
    """
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        version="1.0.0"
    )


@app.post(f"{settings.API_PREFIX}/token", response_model=PollTokenResponse)
async def generate_poll_token(request: PollTokenRequest):
    """
    Generate a unique token for a poll session.
    
    Frontend should call this before showing voting instructions to user.
    The token must be included in the Solemn Declaration text.
    """
    poll_token = str(uuid.uuid4())
    expires_at = datetime.utcnow()  # Add 24 hours in production
    
    # Store token (in production, use Redis with TTL)
    active_poll_tokens[poll_token] = {
        "poll_id": request.poll_id,
        "created_at": datetime.utcnow().isoformat(),
    }
    
    return PollTokenResponse(
        poll_id=request.poll_id,
        poll_token=poll_token,
        expires_at=expires_at.isoformat()
    )


@app.get(f"{settings.API_PREFIX}/instructions", response_model=InstructionsResponse)
async def get_instructions(poll_id: str, poll_token: str):
    """
    Get voting instructions for the frontend.
    
    Returns the gov.gr link and template text with the unique token.
    
    Args:
        poll_id: The poll identifier
        poll_token: Unique session token (get from /token endpoint first)
    """
    template_text = (
        f"I, the undersigned, cast my valid vote for [CHOICE] "
        f"in the Community Poll. Security Token: {poll_token}"
    )
    
    return InstructionsResponse(
        link="https://docs.gov.gr",
        template_text=template_text,
        poll_token=poll_token
    )


@app.post(f"{settings.API_PREFIX}/validate", response_model=ValidationResponse)
async def validate_ballot(
    file: UploadFile = File(..., description="Gov.gr Solemn Declaration PDF"),
    poll_id: str = Form(..., description="Poll identifier"),
    poll_token: str = Form(..., description="Session security token"),
    db: Session = Depends(get_db)
):
    """
    Validate an uploaded Gov.gr Solemn Declaration PDF.
    
    Runs 4 security gates:
    1. Integrity: Verify PAdES digital signature
    2. Uniqueness: Check file hasn't been used before
    3. Context: Verify poll token appears in text
    4. Identity: Verify voter hasn't voted (using hashed AFM)
    
    Args:
        file: The uploaded PDF file
        poll_id: Identifier for the current poll
        poll_token: Unique session token that must appear in the PDF
        
    Returns:
        ValidationResponse with success status and details
    """
    # Validate file type
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="File must be a PDF document"
        )
    
    # Read file bytes
    try:
        pdf_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to read uploaded file: {str(e)}"
        )
    
    # Validate file size (max 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    if len(pdf_bytes) > max_size:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds 10MB limit"
        )
    
    # Run validation
    validator = BallotValidator(db)
    result = await validator.validate(pdf_bytes, poll_id, poll_token)
    
    # Map result to response
    response = ValidationResponse(
        success=result.success,
        message=result.message,
        rejection_reason=result.rejection_reason.value if result.rejection_reason else None,
        vote_choice=result.vote_choice,
        signer_name=result.signer_name
    )
    
    # Set appropriate HTTP status for failures
    if not result.success:
        if result.rejection_reason in [
            RejectionReason.INVALID_SIGNATURE,
            RejectionReason.NO_SIGNATURE,
            RejectionReason.UNKNOWN_SIGNER
        ]:
            # Security violations - 403 Forbidden
            raise HTTPException(status_code=403, detail=response.model_dump())
        elif result.rejection_reason in [
            RejectionReason.DUPLICATE_FILE,
            RejectionReason.ALREADY_VOTED
        ]:
            # Conflict - already processed
            raise HTTPException(status_code=409, detail=response.model_dump())
        else:
            # Bad request - wrong token, AFM not found, etc.
            raise HTTPException(status_code=400, detail=response.model_dump())
    
    return response
    
    
@app.post(f"{settings.API_PREFIX}/verify-identity", response_model=ValidationResponse)
async def verify_identity(
    file: UploadFile = File(..., description="Gov.gr Solemn Declaration PDF"),
    db: Session = Depends(get_db)
):
    """
    Verify user identity from Gov.gr PDF (One-Time Verification).
    
    Checks:
    1. Digital signature
    2. Tax ID (AFM) extraction
    
    Returns:
        ValidationResponse with voter_hash
    """
    # Validate file type
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF document")
        
    # Read bytes
    try:
        pdf_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
        
    # Run validation
    validator = BallotValidator(db)
    result = await validator.validate_identity(pdf_bytes)
    
    response = ValidationResponse(
        success=result.success,
        message=result.message,
        rejection_reason=result.rejection_reason.value if result.rejection_reason else None,
        signer_name=result.signer_name,
        voter_hash=result.voter_hash
    )
    
    if not result.success:
         raise HTTPException(status_code=400, detail=response.model_dump())
         
    return response
@app.get(f"{settings.API_PREFIX}/stats")
async def get_poll_stats(poll_id: str, db: Session = Depends(get_db)):
    """
    Get voting statistics for a poll.
    
    Returns vote counts per choice (without revealing voter identities).
    """
    from sqlalchemy import func
    from models import Vote
    
    results = db.query(
        Vote.vote_choice,
        func.count(Vote.id).label('count')
    ).filter(
        Vote.poll_id == poll_id
    ).group_by(
        Vote.vote_choice
    ).all()
    
    total_votes = sum(r.count for r in results)
    choices = {r.vote_choice: r.count for r in results}
    
    return {
        "poll_id": poll_id,
        "total_votes": total_votes,
        "choices": choices
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
