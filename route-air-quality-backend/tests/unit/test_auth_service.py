"""
Unit tests for the auth service helpers (no DB required).
"""
import pytest
from jose import jwt

from app.services import auth_service
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    send_password_reset_email,
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


def test_send_password_reset_email_requires_smtp_outside_dev_mode(monkeypatch):
    monkeypatch.setattr(settings, "smtp_host", "")
    monkeypatch.setattr(settings, "smtp_user", "")
    monkeypatch.setattr(settings, "otp_dev_mode", False)

    with pytest.raises(RuntimeError, match="Password reset email delivery is not configured."):
        send_password_reset_email("user@example.com", "token")


def test_send_password_reset_email_sets_smtp_timeout(monkeypatch):
    captured: dict[str, object] = {}

    class DummySMTP:
        def __init__(self, host, port, timeout=None):
            captured["host"] = host
            captured["port"] = port
            captured["timeout"] = timeout

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def starttls(self):
            return None

        def login(self, user, password):
            captured["user"] = user
            captured["password"] = password

        def send_message(self, message):
            captured["to"] = message["To"]

    monkeypatch.setattr(settings, "smtp_host", "smtp.example.com")
    monkeypatch.setattr(settings, "smtp_port", 587)
    monkeypatch.setattr(settings, "smtp_user", "sender@example.com")
    monkeypatch.setattr(settings, "smtp_password", "password")
    monkeypatch.setattr(settings, "otp_dev_mode", False)
    monkeypatch.setattr(auth_service.smtplib, "SMTP", DummySMTP)

    send_password_reset_email("user@example.com", "token")

    assert captured["timeout"] == 10
    assert captured["to"] == "user@example.com"
