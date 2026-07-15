from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

NotificationType = Literal["threshold_breach", "route_advisory", "daily_summary"]


class NotificationOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    type: str
    title: str
    body: str
    payload: dict | None = None
    read: bool
    sent_at: datetime
    read_at: datetime | None = None

    model_config = {"from_attributes": True}


class NotificationCreate(BaseModel):
    """Internal — used by the scheduler/alert engine to dispatch notifications."""
    user_id: uuid.UUID
    type: NotificationType
    title: str
    body: str
    payload: dict | None = None


class MarkReadRequest(BaseModel):
    """Mark one or more notifications as read in a single call."""
    notification_ids: list[uuid.UUID]
