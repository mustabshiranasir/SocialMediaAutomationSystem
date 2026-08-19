from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas, auth
from ..skills.account_connectivity import link_social_account, get_platform_capabilities

router = APIRouter(prefix="/api/accounts", tags=["Account Connectivity"])

# All supported platforms (google_business is an alias kept for backwards compat)
SUPPORTED_PLATFORMS = [
    "instagram", "x", "facebook", "pinterest", "twitter", "linkedin",
    "google business", "google_business", "tiktok", "youtube",
    "telegram", "threads", "xing", "wordpress", "reddit"
]


@router.get("", response_model=List[schemas.LinkedAccountResponse])
def list_accounts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """GET /accounts: List all linked social media accounts for the current user."""
    return db.query(models.LinkedAccount).filter(models.LinkedAccount.user_id == current_user.id).all()


@router.get("/supported")
def list_supported_platforms():
    """GET /accounts/supported: Return all platforms the system supports with their capabilities."""
    platforms = [p for p in SUPPORTED_PLATFORMS if "_" not in p]  # deduplicate google_business alias
    return {
        "platforms": [
            {
                "id": p,
                "label": p.title(),
                "capabilities": get_platform_capabilities(p)
            }
            for p in platforms
        ]
    }


@router.post("/link", response_model=schemas.LinkedAccountResponse)
def link_account(
    platform: str,
    auth_code: str = "mock_oauth_code",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """POST /accounts/link: Link a new social media account via OAuth simulation."""
    platform = platform.lower().strip()
    if platform not in SUPPORTED_PLATFORMS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported platform: '{platform}'. Supported: {', '.join(p for p in SUPPORTED_PLATFORMS if '_' not in p)}"
        )

    # Check if already linked — refresh token if so
    existing = db.query(models.LinkedAccount).filter(
        models.LinkedAccount.user_id == current_user.id,
        models.LinkedAccount.platform == platform
    ).first()

    conn_details = link_social_account(platform, auth_code)

    if existing:
        existing.oauth_token = conn_details["oauth_token"]
        existing.status = "active"
        existing.expires_at = conn_details["expires_at"]
        db.commit()
        db.refresh(existing)
        return existing

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


@router.get("/{id}/status")
def get_account_status(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """GET /accounts/{id}/status: Token validity + platform capabilities for a linked account."""
    account = db.query(models.LinkedAccount).filter(
        models.LinkedAccount.id == id,
        models.LinkedAccount.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    return {
        "id": account.id,
        "platform": account.platform,
        "status": account.status,
        "expires_at": account.expires_at,
        "capabilities": get_platform_capabilities(account.platform)
    }


@router.delete("/{id}")
def unlink_account(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """DELETE /accounts/{id}: Unlink a connected account."""
    account = db.query(models.LinkedAccount).filter(
        models.LinkedAccount.id == id,
        models.LinkedAccount.user_id == current_user.id
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    db.delete(account)
    db.commit()
    return {"detail": f"'{account.platform}' account unlinked successfully"}
