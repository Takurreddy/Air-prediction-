"""
Auth helpers: password hashing, JWT creation/decoding, FastAPI dependencies.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.postgres import get_db
from app.models.user import User

# ── Password hashing ──────────────────────────────────────────────────────────
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


# ── JWT ───────────────────────────────────────────────────────────────────────
_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=True)
_oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def create_access_token(data: dict) -> tuple[str, int]:
    """
    Encode `data` into a signed JWT.

    Returns:
        (token_string, expires_in_seconds)
    """
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {**data, "exp": expire}
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token, settings.access_token_expire_minutes * 60


def _decode_token(token: str) -> uuid.UUID:
    """
    Decode a JWT and return the user UUID stored in the `sub` claim.
    Raises HTTP 401 on any failure.
    """
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
        sub: str | None = payload.get("sub")
        if sub is None:
            raise credentials_exc
        return uuid.UUID(sub)
    except (JWTError, ValueError):
        raise credentials_exc


# ── FastAPI dependencies ──────────────────────────────────────────────────────

def get_current_user(
    token: str = Depends(_oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Require a valid JWT; return the corresponding User row."""
    user_id = _decode_token(token)
    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


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
        user_id = _decode_token(token)
        return db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
    except HTTPException:
        return None
