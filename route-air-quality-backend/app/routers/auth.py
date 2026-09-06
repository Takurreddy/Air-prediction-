from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.postgres import get_db
from app.models.user import User
from app.schemas.user import UserProfile, UserProfileUpdate
from app.services.auth_service import get_current_user

router = APIRouter()

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
