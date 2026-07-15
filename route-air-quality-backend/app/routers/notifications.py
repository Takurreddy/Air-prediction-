import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.postgres import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import MarkReadRequest, NotificationOut
from app.services.auth_service import get_current_user

router = APIRouter()


@router.get("", response_model=list[NotificationOut])
def list_notifications(
    unread_only: bool = Query(False, description="Return only unread notifications"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return the authenticated user's notification history (newest first).
    Pass unread_only=true to show only unseen alerts.
    """
    q = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        q = q.filter(Notification.read.is_(False))
    return q.order_by(Notification.sent_at.desc()).limit(limit).all()


@router.get("/unread-count")
def unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the count of unread notifications — cheap badge update call."""
    count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.read.is_(False),
        )
        .count()
    )
    return {"unread_count": count}


@router.patch("/read", status_code=status.HTTP_200_OK)
def mark_as_read(
    payload: MarkReadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark one or more notifications as read in a single request.
    Only affects notifications belonging to the current user.
    """
    now = datetime.now(timezone.utc)
    updated = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.id.in_(payload.notification_ids),
            Notification.read.is_(False),
        )
        .all()
    )
    for n in updated:
        n.read = True
        n.read_at = now
    db.commit()
    return {"marked_read": len(updated)}


@router.patch("/read-all", status_code=status.HTTP_200_OK)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark every unread notification for the current user as read."""
    now = datetime.now(timezone.utc)
    rows = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.read.is_(False),
        )
        .all()
    )
    for n in rows:
        n.read = True
        n.read_at = now
    db.commit()
    return {"marked_read": len(rows)}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Hard-delete a single notification record."""
    n = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
        .first()
    )
    if not n:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )
    db.delete(n)
    db.commit()
