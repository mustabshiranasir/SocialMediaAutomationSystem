from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas, auth
from ..skills.account_connectivity import link_social_account

router = APIRouter(prefix="/api/accounts", tags=["Account Connectivity"])

@router.get("", response_model=List[schemas.LinkedAccountResponse])
def list_accounts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    GET /accounts: List all linked social media accounts.
    """
    return db.query(models.LinkedAccount).filter(models.LinkedAccount.user_id == current_user.id).all()

@router.post("/link", response_model=schemas.LinkedAccountResponse)
def link_account(
    platform: str,
    auth_code: str = "mock_oauth_code",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    POST /accounts/link: Link a new social media account.
    """
    platform = platform.lower()
    allowed_platforms = [
        "instagram", "x", "facebook", "pinterest", "twitter", "linkedin", 
        "google business", "google_business", "tiktok", "youtube", 
        "telegram", "xing", "wordpress", "reddit"
    ]
    if platform not in allowed_platforms:
        raise HTTPException(status_code=400, detail="Unsupported platform")
        
    # Check if already linked
    existing = db.query(models.LinkedAccount).filter(
        models.LinkedAccount.user_id == current_user.id,
        models.LinkedAccount.platform == platform
    ).first()
    
    if existing:
        # Update connection
        conn_details = link_social_account(platform, auth_code)
        existing.oauth_token = conn_details["oauth_token"]
        existing.status = "active"
        existing.expires_at = conn_details["expires_at"]
        db.commit()
        db.refresh(existing)
        return existing
        
    # Create new link
    conn_details = link_social_account(platform, auth_code)
    db_account = models.LinkedAccount(
        user_id=current_user.id,
        platform=platform,
        oauth_token=conn_details["oauth_token"],
        status="active",
        expires_at=conn_details["expires_at"]
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

@router.delete("/{id}")
def unlink_account(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    DELETE /accounts/{id}: Unlink a connected account.
    """
    account = db.query(models.LinkedAccount).filter(
        models.LinkedAccount.id == id,
        models.LinkedAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    db.delete(account)
    db.commit()
    return {"detail": "Account unlinked successfully"}
