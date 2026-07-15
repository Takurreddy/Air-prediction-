from __future__ import annotations

from pydantic import BaseModel


class StationOut(BaseModel):
    station_id: str
    name: str | None = None
    city: str
    country: str | None = None
    latitude: float
    longitude: float
    source_api: str | None = None
    is_active: bool = True

    model_config = {"from_attributes": True}


class StationCreate(BaseModel):
    station_id: str
    name: str | None = None
    city: str
    country: str | None = None
    latitude: float
    longitude: float
    source_api: str | None = None
