"""
Auth helpers: password hashing, JWT creation/decoding, FastAPI dependencies.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import httpx
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
_clerk_jwks_cache: dict | None = None


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


def _fetch_clerk_jwks() -> dict:
    global _clerk_jwks_cache
    if _clerk_jwks_cache is not None:
        return _clerk_jwks_cache

    response = httpx.get(settings.clerk_jwks_url, timeout=5.0)
    response.raise_for_status()
    _clerk_jwks_cache = response.json()
    return _clerk_jwks_cache


def _decode_clerk_token(token: str) -> dict:
    if not settings.clerk_enabled:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        header = jwt.get_unverified_header(token)
    except JWTError as exc:
        raise credentials_exc from exc

    kid = header.get("kid")
    if not kid:
        raise credentials_exc

    try:
        jwks = _fetch_clerk_jwks()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Clerk JWKS fetch failed: {exc}",
        ) from exc

    keys = jwks.get("keys", [])
    key = next((entry for entry in keys if entry.get("kid") == kid), None)
    if key is None:
        raise credentials_exc

    decode_kwargs = {
        "algorithms": ["RS256"],
    }
    if settings.clerk_issuer:
        decode_kwargs["issuer"] = settings.clerk_issuer
    if settings.clerk_audience:
        decode_kwargs["audience"] = settings.clerk_audience
    else:
        decode_kwargs["options"] = {"verify_aud": False}

    try:
        return jwt.decode(token, key, **decode_kwargs)
    except JWTError as exc:
        raise credentials_exc from exc


def _upsert_user_from_clerk_claims(claims: dict, db: Session) -> User:
    email = (
        claims.get("email")
        or claims.get("email_address")
        or claims.get("https://clerk.dev/email")
    )
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "Clerk token is missing email claim. Configure your Clerk JWT template "
                "to include `email`."
            ),
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        user = User(
            email=email,
            hashed_password=hash_password(uuid.uuid4().hex),
            full_name=claims.get("name") or claims.get("given_name"),
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    full_name = claims.get("name") or claims.get("given_name")
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
    try:
        user_id = _decode_token(token)
        user = db.query(User).filter(User.id == user_id, User.is_active.is_(True)).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user
    except HTTPException as jwt_error:
        if not settings.clerk_enabled:
            raise jwt_error

    clerk_claims = _decode_clerk_token(token)
    user = _upsert_user_from_clerk_claims(clerk_claims, db)
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
