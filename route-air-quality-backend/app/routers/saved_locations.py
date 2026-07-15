import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.postgres import get_db
from app.models.saved_location import SavedLocation
from app.models.user import User
from app.schemas.saved_location import SavedLocationCreate, SavedLocationOut, SavedLocationUpdate
from app.services.auth_service import get_current_user

router = APIRouter()


@router.get("", response_model=list[SavedLocationOut])
def list_saved_locations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all saved locations for the authenticated user."""
    return (
        db.query(SavedLocation)
        .filter(SavedLocation.user_id == current_user.id)
        .order_by(SavedLocation.created_at)
        .all()
    )


@router.post("", response_model=SavedLocationOut, status_code=status.HTTP_201_CREATED)
def create_saved_location(
    payload: SavedLocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Save a named location.
    The partial unique indexes on the DB enforce one home and one work per user —
    attempting to add a second home/work returns HTTP 409.
    """
    location = SavedLocation(
        user_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(location)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        flag = "home" if payload.is_home else "work"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"You already have a {flag} location saved. Update or delete it first.",
        )
    db.refresh(location)
    return location


@router.get("/{location_id}", response_model=SavedLocationOut)
def get_saved_location(
    location_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve a single saved location by ID."""
    return _get_owned_location(location_id, current_user.id, db)


@router.patch("/{location_id}", response_model=SavedLocationOut)
def update_saved_location(
    location_id: uuid.UUID,
    payload: SavedLocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update name, address, metadata, or home/work flags."""
    location = _get_owned_location(location_id, current_user.id, db)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(location, field, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Another location is already marked as home or work.",
        )
    db.refresh(location)
    return location


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_saved_location(
    location_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Permanently remove a saved location."""
    location = _get_owned_location(location_id, current_user.id, db)
    db.delete(location)
    db.commit()


# ── helpers ───────────────────────────────────────────────────────────────────

def _get_owned_location(
    location_id: uuid.UUID, user_id: uuid.UUID, db: Session
) -> SavedLocation:
    loc = (
        db.query(SavedLocation)
        .filter(
            SavedLocation.id == location_id,
            SavedLocation.user_id == user_id,
        )
        .first()
    )
    if not loc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved location not found.",
        )
    return loc
