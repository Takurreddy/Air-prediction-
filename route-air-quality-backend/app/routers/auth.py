import hmac
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.postgres import get_db
from app.models.user import User
from app.schemas.user import (
    UserSignup,
    UserLogin,
    TokenResponse,
    UserProfile,
    UserProfileUpdate,
    OtpRequest,
    OtpVerify,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.models.otp_challenge import OtpChallenge
from app.core.config import settings
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    generate_otp,
    hash_otp,
    normalize_phone,
    send_otp_sms,
    generate_password_reset_token,
    verify_password_reset_token,
    send_password_reset_email,
)

router = APIRouter()


@router.post("/otp/request")
def request_otp(payload: OtpRequest, db: Session = Depends(get_db)):
    try:
        phone = normalize_phone(payload.phone_number)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    code = generate_otp()
    challenge = OtpChallenge(
        phone_number=phone,
        code_hash=hash_otp(phone, code),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expire_minutes),
    )
    db.query(OtpChallenge).filter(
        OtpChallenge.phone_number == phone,
        OtpChallenge.consumed.is_(False),
    ).update({OtpChallenge.consumed: True}, synchronize_session=False)
    db.add(challenge)
    db.commit()
    try:
        send_otp_sms(phone, code)
    except Exception as exc:
        db.delete(challenge)
        db.commit()
        raise HTTPException(
            status_code=503,
            detail="OTP delivery is temporarily unavailable. Please try again later.",
        ) from exc

    response = {
        "message": "OTP sent to your phone number.",
        "expires_in": settings.otp_expire_minutes * 60,
    }
    if settings.otp_dev_mode:
        response["dev_code"] = code
    return response


@router.post("/otp/verify", response_model=TokenResponse)
def verify_otp(payload: OtpVerify, db: Session = Depends(get_db)):
    try:
        phone = normalize_phone(payload.phone_number)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    challenge = db.query(OtpChallenge).filter(
        OtpChallenge.phone_number == phone,
        OtpChallenge.consumed.is_(False),
    ).order_by(OtpChallenge.created_at.desc()).first()
    now = datetime.now(timezone.utc)
    if not challenge:
        raise HTTPException(status_code=401, detail="This OTP is invalid or expired.")
    expires_at = challenge.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= now or challenge.attempts >= settings.otp_max_attempts:
        raise HTTPException(status_code=401, detail="This OTP is invalid or expired.")

    challenge.attempts += 1
    if not hmac.compare_digest(challenge.code_hash, hash_otp(phone, payload.code)):
        db.commit()
        raise HTTPException(status_code=401, detail="This OTP is invalid or expired.")

    challenge.consumed = True
    user = db.query(User).filter(User.phone_number == phone).first()
    if not user:
        user = User(
            phone_number=phone,
            full_name=payload.full_name,
            hashed_password=hash_password(secrets.token_urlsafe(32)),
        )
        db.add(user)
        db.flush()
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled.")
    db.commit()
    token, expires_in = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, expires_in=expires_in)


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: UserSignup, db: Session = Depends(get_db)):
    """Register a new user and return a JWT access token."""
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token, expires_in = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, expires_in=expires_in)


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with email + password and return a JWT access token."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled.",
        )

    token, expires_in = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, expires_in=expires_in)


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Send a password reset email if the user exists."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # To prevent email enumeration, return the same success response
        return {"message": "If an account with that email exists, we have sent a reset link."}
    if not user.is_active:
        return {"message": "If an account with that email exists, we have sent a reset link."}

    token = generate_password_reset_token(payload.email)
    try:
        send_password_reset_email(payload.email, token)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Could not send email. Please try again later.") from exc

    return {"message": "If an account with that email exists, we have sent a reset link."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset the user's password using the token sent via email."""
    email = verify_password_reset_token(payload.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    user.hashed_password = hash_password(payload.new_password)
    db.commit()

    return {"message": "Password has been successfully reset. You can now log in."}


@router.get("/me", response_model=UserProfile)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return current_user


@router.patch("/me", response_model=UserProfile)
def update_me(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update mutable profile fields (full_name, health_profile, notification_prefs)."""
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user
