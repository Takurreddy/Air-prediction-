"""
Auth helpers: FastAPI dependencies for Supabase JWT verification.
"""
from __future__ import annotations

import logging
import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.postgres import get_db
from app.models.user import User

log = logging.getLogger(__name__)

_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=True)
_oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def _upsert_user_from_supabase(user_data: dict, db: Session) -> User:
    email = user_data.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Supabase token is missing email.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Try to find by email
    user = db.query(User).filter(User.email == email).first()
    
    user_metadata = user_data.get("user_metadata", {})
    full_name = user_metadata.get("full_name") or user_metadata.get("name")
    
    if user is None:
        user = User(
            email=email,
            hashed_password="[SUPABASE_AUTH_MANAGED]", # Placeholder since Supabase manages passwords
            full_name=full_name,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    needs_update = False
    if full_name and user.full_name != full_name:
        user.full_name = full_name
        needs_update = True
    if not user.is_verified:
        user.is_verified = True
        needs_update = True
        
    if needs_update:
        db.commit()
        db.refresh(user)
    return user


def _resolve_user_from_token(token: str, db: Session) -> User:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not settings.supabase_url or not settings.supabase_key:
        log.error("Supabase URL or Key is not configured in environment variables.")
        raise HTTPException(status_code=500, detail="Internal Auth Configuration Error")

    # Call Supabase Auth API to get user details using the access token
    try:
        response = httpx.get(
            f"{settings.supabase_url}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": settings.supabase_key,
            },
            timeout=5.0
        )
        if response.status_code != 200:
            log.warning(f"Supabase auth failed: {response.text}")
            raise credentials_exc
            
        user_data = response.json()
    except httpx.RequestError as exc:
        log.error(f"Error reaching Supabase API: {exc}")
        raise HTTPException(status_code=503, detail="Auth provider unavailable")

    user = _upsert_user_from_supabase(user_data, db)
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


# ── FastAPI dependencies ──────────────────────────────────────────────────────

def get_current_user(
    token: str = Depends(_oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Require a valid JWT; return the corresponding User row."""
    return _resolve_user_from_token(token, db)


def get_optional_user(
    token: str | None = Depends(_oauth2_scheme_optional),
    db: Session = Depends(get_db),
) -> User | None:
    """
    Return the current user if a valid JWT is present, otherwise None.
    Use on endpoints that accept both authenticated and anonymous requests.
    """
    if token is None:
        return None
    try:
        return _resolve_user_from_token(token, db)
    except HTTPException:
        return None
