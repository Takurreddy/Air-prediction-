from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class SavedLocationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    latitude: float = Field(ge=-90.0,  le=90.0)
    longitude: float = Field(ge=-180.0, le=180.0)
    address: str | None = Field(None, max_length=512)
    location_metadata: dict | None = None
    is_home: bool = False
    is_work: bool = False


class SavedLocationUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=128)
    address: str | None = None
    location_metadata: dict | None = None
    is_home: bool | None = None
    is_work: bool | None = None


class SavedLocationOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    latitude: float
    longitude: float
    address: str | None = None
    location_metadata: dict | None = None
    is_home: bool
    is_work: bool
    created_at: datetime

    model_config = {"from_attributes": True}
