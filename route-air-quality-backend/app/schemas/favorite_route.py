from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


# ── Sub-schemas for the JSON columns ─────────────────────────────────────────

class RouteEndpoint(BaseModel):
    """Origin or destination point."""
    lat: float
    lng: float
    address: str | None = None


class RouteWaypointPoint(BaseModel):
    """Intermediate stop along the route."""
    lat: float
    lng: float
    address: str | None = None


class SegmentExposure(BaseModel):
    """Pre-computed AQI exposure for one route segment."""
    segment: int
    distance_km: float
    avg_aqi: float
    duration_min: float


# ── Request / response ────────────────────────────────────────────────────────

class FavoriteRouteCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    origin: RouteEndpoint
    destination: RouteEndpoint
    waypoints: list[RouteWaypointPoint] = Field(default_factory=list)
    # route_geometry and aqi_exposure_profile are computed server-side;
    # clients do not supply them on creation.


class FavoriteRouteUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    origin: RouteEndpoint | None = None
    destination: RouteEndpoint | None = None
    waypoints: list[RouteWaypointPoint] | None = None


class FavoriteRouteOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    origin: dict
    destination: dict
    waypoints: list | None = None
    route_geometry: dict | None = None
    aqi_exposure_profile: list | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
