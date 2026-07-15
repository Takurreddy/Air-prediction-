"""
Unit tests for the auth service helpers (no DB required).
"""
import pytest
from jose import jwt

from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
)
from app.core.config import settings


def test_hash_password_is_not_plaintext():
    hashed = hash_password("mysecret")
    assert hashed != "mysecret"
    assert len(hashed) > 20


def test_verify_password_correct():
    hashed = hash_password("correct-horse")
    assert verify_password("correct-horse", hashed) is True


def test_verify_password_wrong():
    hashed = hash_password("correct-horse")
    assert verify_password("wrong-horse", hashed) is False


def test_create_access_token_returns_tuple():
    token, expires_in = create_access_token({"sub": "42"})
    assert isinstance(token, str)
    assert expires_in == settings.access_token_expire_minutes * 60


def test_create_access_token_contains_sub():
    token, _ = create_access_token({"sub": "99"})
    payload = jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
    )
    assert payload["sub"] == "99"


def test_create_access_token_has_exp():
    token, _ = create_access_token({"sub": "1"})
    payload = jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
    )
    assert "exp" in payload
