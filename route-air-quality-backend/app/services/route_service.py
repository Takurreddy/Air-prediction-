"""
Route evaluation service.

Workflow
────────
1.  Fetch route geometry (waypoints) from the routing provider
    (Google Maps Directions API or OSRM fallback).
2.  For each waypoint, find the nearest monitoring station within
    `settings.route_station_radius_km` and look up its latest AQI from
    InfluxDB.  If no live reading exists, fall back to the LSTM prediction
    for that station.
3.  Aggregate per-waypoint AQI scores into per-alternative summaries.
4.  Pick the alternative with the lowest average AQI as the recommendation.
5.  Persist the query + waypoints to Postgres and route_score to InfluxDB.

NOTE: The routing-provider integration and nearest-station resolution are
      currently stubbed.  Replace the `_fetch_routes` and
      `_score_waypoints` helpers with real implementations when the
      external API keys are configured.
"""
from __future__ import annotations

import logging
import math
import uuid
from typing import TYPE_CHECKING

from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import influx as influx_db
from app.models.route import RouteQuery, RouteWaypoint
from app.schemas.route import (
    Coordinate,
    RouteAlternative,
    RouteOut,
    RouteRequest,
    RouteWaypointOut,
)

if TYPE_CHECKING:
    from app.models.user import User

log = logging.getLogger(__name__)


# ── Geo helper ────────────────────────────────────────────────────────────────

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two lat/lon points in kilometres."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── Stub routing provider ─────────────────────────────────────────────────────

def _fetch_routes(request: RouteRequest) -> list[list[Coordinate]]:
    """
    Fetch route alternatives from the routing provider.

    Returns a list of alternatives; each alternative is an ordered list of
    Coordinate waypoints (origin → intermediate points → destination).

    TODO: Implement real routing via Google Maps Directions API or OSRM.
          Use `settings.google_maps_api_key` / `settings.osrm_base_url`.
    """
    # Stub: return a single straight-line route (origin → destination)
    origin = Coordinate(latitude=request.origin_lat, longitude=request.origin_lon)
    destination = Coordinate(latitude=request.dest_lat, longitude=request.dest_lon)

    # Include any caller-supplied intermediate waypoints
    midpoints = request.waypoints or []

    return [[origin, *midpoints, destination]]


# ── AQI scoring ───────────────────────────────────────────────────────────────

def _get_aqi_for_point(lat: float, lon: float) -> tuple[float | None, str | None, str | None]:
    """
    Return (aqi, category, source) for the nearest station to (lat, lon).

    1. Query InfluxDB for the nearest live reading within the configured radius.
    2. If nothing found, return (None, None, None) — the caller may choose to
       interpolate or skip.

    TODO: Add LSTM-prediction fallback when live data is stale.
    """
    try:
        tables = influx_db.query_nearest_station_aqi(
            latitude=lat,
            longitude=lon,
            radius_km=settings.route_station_radius_km,
        )
        best_aqi: float | None = None
        best_dist = float("inf")
        nearest_station: str | None = None

        for table in tables:
            for record in table.records:
                r_lat = record.values.get("latitude")
                r_lon = record.values.get("longitude")
                aqi_val = record.get_value()
                if r_lat is None or r_lon is None or aqi_val is None:
                    continue
                dist = _haversine_km(lat, lon, float(r_lat), float(r_lon))
                if dist < best_dist:
                    best_dist = dist
                    best_aqi = float(aqi_val)
                    nearest_station = record.values.get("station_id")

        if best_aqi is not None:
            from app.services.ml_interface import categorize_aqi
            return best_aqi, categorize_aqi(best_aqi), "live"
    except Exception as exc:
        log.warning("AQI lookup failed for (%s, %s): %s", lat, lon, exc)

    return None, None, None


# ── Main entry point ──────────────────────────────────────────────────────────

def evaluate_routes(
    request: RouteRequest,
    db: Session,
    user: "User | None",
) -> RouteOut:
    """
    Evaluate all route alternatives, score each by AQI, and return the
    full RouteOut payload.  Persists results to Postgres + InfluxDB.
    """
    route_id = str(uuid.uuid4())
    alternatives_raw = _fetch_routes(request)

    scored_alternatives: list[RouteAlternative] = []
    all_avg_aqis: list[float] = []

    for alt_idx, waypoints in enumerate(alternatives_raw):
        scored_wps: list[RouteWaypointOut] = []
        aqi_values: list[float] = []

        for wp in waypoints:
            aqi, category, source = _get_aqi_for_point(wp.latitude, wp.longitude)
            scored_wps.append(
                RouteWaypointOut(
                    latitude=wp.latitude,
                    longitude=wp.longitude,
                    aqi=aqi,
                    category=category,
                    source=source,
                )
            )
            if aqi is not None:
                aqi_values.append(aqi)

                # Write per-waypoint score to InfluxDB (best-effort)
                try:
                    influx_db.write_route_score(
                        route_id=route_id,
                        waypoint_index=len(scored_wps) - 1,
                        latitude=wp.latitude,
                        longitude=wp.longitude,
                        aqi=aqi,
                        category=category or "Unknown",
                    )
                except Exception:
                    pass

        avg_aqi = round(sum(aqi_values) / len(aqi_values), 2) if aqi_values else None
        max_aqi = round(max(aqi_values), 2) if aqi_values else None
        all_avg_aqis.append(avg_aqi if avg_aqi is not None else float("inf"))

        scored_alternatives.append(
            RouteAlternative(
                alternative_index=alt_idx,
                waypoints=scored_wps,
                avg_aqi=avg_aqi,
                max_aqi=max_aqi,
            )
        )

    # Pick healthiest alternative (lowest avg AQI)
    recommended_idx = int(all_avg_aqis.index(min(all_avg_aqis)))
    rec_aqi = all_avg_aqis[recommended_idx]
    from app.services.ml_interface import categorize_aqi
    if rec_aqi == float("inf"):
        recommendation = "No live AQI data available — route scoring pending ingestion."
    else:
        cat = categorize_aqi(rec_aqi)
        recommendation = (
            f"Route {recommended_idx + 1} is the healthiest option "
            f"(avg AQI {rec_aqi:.1f} — {cat})."
        )

    # Persist query to Postgres
    route_query: RouteQuery | None = None
    try:
        route_query = RouteQuery(
            user_id=user.id if user else None,
            origin_lat=request.origin_lat,
            origin_lon=request.origin_lon,
            dest_lat=request.dest_lat,
            dest_lon=request.dest_lon,
            provider="stub",
            recommended_route_index=recommended_idx,
            avg_aqi=scored_alternatives[recommended_idx].avg_aqi,
            recommendation=recommendation,
        )
        db.add(route_query)
        db.flush()  # get route_query.id before adding children

        for alt_idx, alt in enumerate(scored_alternatives):
            for seq_idx, wp in enumerate(alt.waypoints):
                db.add(
                    RouteWaypoint(
                        route_query_id=route_query.id,
                        alternative_index=alt_idx,
                        sequence_index=seq_idx,
                        latitude=wp.latitude,
                        longitude=wp.longitude,
                        station_id=wp.station_id,
                        aqi=wp.aqi,
                        category=wp.category,
                        source=wp.source,
                    )
                )
        db.commit()
    except Exception as exc:
        log.warning("Failed to persist route query: %s", exc)
        db.rollback()

    return RouteOut(
        origin=Coordinate(latitude=request.origin_lat, longitude=request.origin_lon),
        destination=Coordinate(latitude=request.dest_lat, longitude=request.dest_lon),
        alternatives=scored_alternatives,
        recommended_index=recommended_idx,
        recommendation=recommendation,
        route_query_id=route_query.id if route_query else None,
    )
