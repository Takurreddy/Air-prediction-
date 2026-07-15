from __future__ import annotations

from pydantic import BaseModel, Field


# ── Live / historical readings ────────────────────────────────────────────────

class ReadingOut(BaseModel):
    station_id: str
    timestamp: str
    pm25: float | None = None
    pm10: float | None = None
    no2: float | None = None
    so2: float | None = None
    co: float | None = None
    ozone: float | None = None
    temperature: float | None = None
    humidity: float | None = None


class AirQualityOut(BaseModel):
    station_id: str
    city: str
    latitude: float
    longitude: float
    timestamp: str
    pm25: float | None = None
    pm10: float | None = None
    no2: float | None = None
    temperature: float | None = None
    humidity: float | None = None
    aqi: float | None = None
    category: str | None = None


# ── Alerts ────────────────────────────────────────────────────────────────────

class AlertCreate(BaseModel):
    station_id: str
    threshold_aqi: float = Field(gt=0, le=500)
    notify_email: bool = True
    notify_push: bool = False


class AlertOut(BaseModel):
    id: int
    user_id: int
    station_id: str
    threshold_aqi: float
    notify_email: bool
    notify_push: bool
    is_active: bool

    model_config = {"from_attributes": True}
