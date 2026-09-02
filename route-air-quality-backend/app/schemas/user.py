from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(None, max_length=255)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)



class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int   # seconds


# ── Profile ───────────────────────────────────────────────────────────────────

class UserProfile(BaseModel):
    id: uuid.UUID
    email: str | None = None
    phone_number: str | None = None
    full_name: str | None = None
    health_profile: dict | None = None
    notification_prefs: dict | None = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OtpRequest(BaseModel):
    phone_number: str = Field(min_length=8, max_length=20)
    full_name: str | None = Field(None, max_length=255)


class OtpVerify(BaseModel):
    phone_number: str = Field(min_length=8, max_length=20)
    code: str = Field(min_length=4, max_length=8)
    full_name: str | None = Field(None, max_length=255)


class UserProfileUpdate(BaseModel):
    """Fields the user can edit on their own profile."""
    full_name: str | None = Field(None, max_length=255)
    # health_profile example:
    #   {"sensitivity": "asthmatic", "age_group": "adult",
    #    "custom_thresholds": {"pm25": 25}}
    health_profile: dict | None = None
    # notification_prefs example:
    #   {"push_enabled": true, "threshold_aqi": 100,
    #    "quiet_hours": {"start": "22:00", "end": "07:00"}}
    notification_prefs: dict | None = None
