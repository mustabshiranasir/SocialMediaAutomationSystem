from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import datetime
import os

from ..database import get_db
from .. import models, auth
from ..skills.oauth_providers import get_authorization_url, exchange_code_for_token

router = APIRouter(prefix="/api/oauth", tags=["OAuth"])

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

@router.get("/login/{platform}")
def oauth_login(
    platform: str, 
    token: str = Query(..., description="The user's JWT token to identify who is linking the account")
):
    """
    Step 1: The frontend redirects the user here. 
    We decode the token to get the user_id, generate the OAuth URL, and redirect the user to the platform.
    """
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise ValueError()
        
        # Get DB manually since we can't easily use Depends outside a standard route parameter context
        # Or we can just pass DB as a dependency
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        from ..database import SessionLocal
        db = SessionLocal()
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            raise ValueError()
        auth_url = get_authorization_url(platform, user.id)
        db.close()
        return RedirectResponse(url=auth_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/callback/{platform}")
def oauth_callback(
    platform: str,
    code: str = None,
    state: str = None,
    error: str = None,
    db: Session = Depends(get_db)
):
    """
    Step 2: The social platform redirects the user back here with an authorization code.
    We exchange it for an access token, save it to the database, and redirect back to the frontend.
    """
    if error:
        # If the user clicked "Cancel" on the consent screen
        return RedirectResponse(url=f"{FRONTEND_URL}?oauth_error={error}")
        
    if not code or not state:
        return RedirectResponse(url=f"{FRONTEND_URL}?oauth_error=missing_parameters")

    # State contains {user_id}_{platform}
    try:
        user_id_str, expected_platform = state.split("_", 1)
        user_id = int(user_id_str)
        if expected_platform != platform:
            raise ValueError("State platform mismatch")
    except Exception:
        return RedirectResponse(url=f"{FRONTEND_URL}?oauth_error=invalid_state")

    try:
        # Exchange the code for a real access token
        token_data = exchange_code_for_token(platform, code)
        
        # Save to database
        existing = db.query(models.LinkedAccount).filter(
            models.LinkedAccount.user_id == user_id,
            models.LinkedAccount.platform == platform
        ).first()

        expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=token_data["expires_in_days"])

        if existing:
            existing.oauth_token = token_data["access_token"]
            existing.status = "active"
            existing.expires_at = expires_at
            db.commit()
        else:
            new_account = models.LinkedAccount(
                user_id=user_id,
                platform=platform,
                oauth_token=token_data["access_token"],
                status="active",
                expires_at=expires_at
            )
            db.add(new_account)
            db.commit()

        # Redirect back to the frontend dashboard with a success flag
        return RedirectResponse(url=f"{FRONTEND_URL}?oauth_success=true&platform={platform}")

    except Exception as e:
        return RedirectResponse(url=f"{FRONTEND_URL}?oauth_error={str(e)}")
