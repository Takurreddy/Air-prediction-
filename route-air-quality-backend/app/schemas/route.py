from __future__ import annotations

from pydantic import BaseModel, Field


# ── Route request / response ──────────────────────────────────────────────────

class Coordinate(BaseModel):
    latitude: float = Field(..., ge=-90.0,  le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)


class RouteWaypointOut(BaseModel):
    """AQI-annotated waypoint returned in a route evaluation response."""
    latitude:   float
    longitude:  float
    station_id: str | None = None    # nearest station used
    aqi:        float | None = None
    category:   str | None = None
    source:     str | None = None    # "live" | "predicted" | "interpolated"


class RouteAlternative(BaseModel):
    """One candidate route (primary or alternative) with its AQI profile."""
    alternative_index: int           # 0 = primary route, 1..N = alternatives
    waypoints:         list[RouteWaypointOut]
    avg_aqi:           float | None = None
    max_aqi:           float | None = None
    distance_m:        float | None = None   # total distance in metres
    duration_s:        float | None = None   # estimated travel time in seconds
    summary:           str | None = None     # human-readable route label


class RouteRequest(BaseModel):
    origin_lat:  float = Field(..., ge=-90.0,  le=90.0)
    origin_lon:  float = Field(..., ge=-180.0, le=180.0)
    dest_lat:    float = Field(..., ge=-90.0,  le=90.0)
    dest_lon:    float = Field(..., ge=-180.0, le=180.0)

    # Optional: caller may pre-supply intermediate waypoints
    waypoints: list[Coordinate] = Field(
        default_factory=list,
        description="Optional intermediate waypoints (passed through to routing API).",
    )

    # How many route alternatives to evaluate (capped at settings.route_max_alternatives)
    alternatives: int = Field(default=1, ge=1, le=5)

    # If True, use LSTM predictions for stations with stale live readings
    use_predictions: bool = True


class RouteOut(BaseModel):
    """
    Full route evaluation result — contains all alternatives scored by AQI,
    with the recommended (lowest avg AQI) alternative flagged explicitly.
    """
    origin:      Coordinate
    destination: Coordinate
    alternatives: list[RouteAlternative]

    # Index into `alternatives` pointing to the healthiest route
    recommended_index: int = 0
    recommendation:    str

    # Persisted query ID (null if storage is unavailable)
    route_query_id: int | None = None


class RouteHistoryOut(BaseModel):
    """Summary entry for a past route query, returned in history lists."""
    id:            int
    origin_lat:    float
    origin_lon:    float
    dest_lat:      float
    dest_lon:      float
    origin_label:  str | None = None
    dest_label:    str | None = None
    avg_aqi:       float | None = None
    recommendation: str | None = None
    created_at:    str

    model_config = {"from_attributes": True}
