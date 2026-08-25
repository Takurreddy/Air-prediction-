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

def _fetch_routes(request: RouteRequest) -> list[dict]:
    """
    Fetch route alternatives from OSRM (free) or Google Maps if key is set.
    Returns a list of dicts containing waypoints, distance_m, and duration_s.
    """
    if settings.google_maps_api_key:
        return _fetch_routes_google(request)
    return _fetch_routes_osrm(request)


def _decode_polyline(encoded: str) -> list[Coordinate]:
    """Decode a Google Maps encoded polyline string into Coordinate list."""
    coords: list[Coordinate] = []
    index, lat, lng = 0, 0, 0
    while index < len(encoded):
        for is_lng in (False, True):
            shift, result = 0, 0
            while True:
                b = ord(encoded[index]) - 63
                index += 1
                result |= (b & 0x1F) << shift
                shift += 5
                if b < 0x20:
                    break
            delta = ~(result >> 1) if result & 1 else result >> 1
            if is_lng:
                lng += delta
                coords.append(Coordinate(latitude=lat / 1e5, longitude=lng / 1e5))
            else:
                lat += delta
    return coords


def _fetch_routes_google(request: RouteRequest) -> list[dict]:
    """Fetch up to 3 route alternatives from Google Maps Directions API."""
    import httpx
    waypoints_str = ""
    if request.waypoints:
        parts = [f"{w.latitude},{w.longitude}" for w in request.waypoints]
        waypoints_str = "|".join(parts)

    params = {
        "origin":       f"{request.origin_lat},{request.origin_lon}",
        "destination":  f"{request.dest_lat},{request.dest_lon}",
        "alternatives": "true",
        "key":          settings.google_maps_api_key,
    }
    if waypoints_str:
        params["waypoints"] = waypoints_str

    try:
        resp = httpx.get(
            "https://maps.googleapis.com/maps/api/directions/json",
            params=params,
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()

        if data.get("status") != "OK":
            log.warning("Google Maps returned status: %s", data.get("status"))
            return _fetch_routes_osrm(request)

        alternatives: list[dict] = []
        for route in data.get("routes", []):
            polyline = route["overview_polyline"]["points"]
            coords = _decode_polyline(polyline)
            if not coords:
                continue
            # Sample every Nth point to keep waypoint count manageable
            step = max(1, len(coords) // 20)
            sampled = coords[::step]
            if sampled and sampled[-1] != coords[-1]:
                sampled.append(coords[-1])
                
            distance_m = sum(leg["distance"]["value"] for leg in route.get("legs", [])) if "legs" in route else None
            duration_s = sum(leg["duration"]["value"] for leg in route.get("legs", [])) if "legs" in route else None
            
            alternatives.append({
                "waypoints": sampled,
                "distance_m": distance_m,
                "duration_s": duration_s
            })

        return alternatives if alternatives else _fetch_routes_osrm(request)

    except Exception as exc:
        log.warning("Google Maps routing failed (%s) — falling back to OSRM", exc)
        return _fetch_routes_osrm(request)


def _fetch_routes_osrm(request: RouteRequest) -> list[dict]:
    """Fetch route alternatives from the free OSRM routing engine."""
    import httpx

    coords_str = (
        f"{request.origin_lon},{request.origin_lat}"
        f";{request.dest_lon},{request.dest_lat}"
    )
    url = f"{settings.osrm_base_url}/route/v1/driving/{coords_str}"

    try:
        resp = httpx.get(
            url,
            params={"overview": "full", "geometries": "geojson", "alternatives": "true"},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()

        alternatives: list[dict] = []
        for route in data.get("routes", []):
            geojson_coords = route["geometry"]["coordinates"]
            # Sample every Nth point
            step = max(1, len(geojson_coords) // 20)
            sampled = geojson_coords[::step]
            coords = [Coordinate(latitude=c[1], longitude=c[0]) for c in sampled]
            
            alternatives.append({
                "waypoints": coords,
                "distance_m": route.get("distance"),
                "duration_s": route.get("duration")
            })

        return alternatives if alternatives else _straight_line_fallback(request)

    except Exception as exc:
        log.warning("OSRM routing failed (%s) — using straight-line fallback", exc)
        return _straight_line_fallback(request)


def _straight_line_fallback(request: RouteRequest) -> list[dict]:
    """Last resort: straight line from origin to destination."""
    origin = Coordinate(latitude=request.origin_lat, longitude=request.origin_lon)
    destination = Coordinate(latitude=request.dest_lat, longitude=request.dest_lon)
    midpoints = request.waypoints or []
    waypoints = [origin, *midpoints, destination]
    
    total_dist = 0.0
    for i in range(len(waypoints) - 1):
        total_dist += _haversine_km(waypoints[i].latitude, waypoints[i].longitude, 
                                   waypoints[i+1].latitude, waypoints[i+1].longitude)
    
    duration_s = (total_dist / 50.0) * 3600
    
    return [{
        "waypoints": waypoints,
        "distance_m": total_dist * 1000,
        "duration_s": duration_s
    }]


# ── AQI scoring ───────────────────────────────────────────────────────────────

def _get_aqi_for_point(
    lat: float, lon: float, db: Session | None = None
) -> tuple[float | None, str | None, str | None]:
    """
    Return (aqi, category, source) for the nearest station to (lat, lon).

    1. Query InfluxDB for the nearest live reading within the configured radius.
    2. If missing, fall back to LSTM prediction for the nearest active station.
    3. If neither live data nor prediction is available, return (None, None, None).
    """
    # 1. Live AQI lookup
    try:
        tables = influx_db.query_nearest_station_aqi(
            latitude=lat,
            longitude=lon,
            radius_km=settings.route_station_radius_km,
        )
        best_aqi: float | None = None
        best_dist = float("inf")

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

        if best_aqi is not None:
            from app.services.ml_interface import categorize_aqi
            return best_aqi, categorize_aqi(best_aqi), "live"
    except Exception as exc:
        log.warning("Live AQI lookup failed for (%s, %s): %s", lat, lon, exc)

    # 2. LSTM Prediction Fallback
    if db is not None:
        try:
            from app.models.station import Station
            from app.services.ml_interface import SEQ_LENGTH, categorize_aqi, predict_aqi

            stations = db.query(Station).filter(Station.is_active.is_(True)).all()
            closest_station: Station | None = None
            min_dist = float("inf")

            for s in stations:
                d = _haversine_km(lat, lon, s.latitude, s.longitude)
                if d < min_dist:
                    min_dist = d
                    closest_station = s

            # Fall back to nearest active station within 25 km
            if closest_station and min_dist <= 25.0:
                # Check for stored predictions in InfluxDB first
                pred_tables = influx_db.query_predictions(
                    station_id=closest_station.station_id, start="-6h"
                )
                for table in pred_tables:
                    for record in table.records:
                        pred_aqi = record.values.get("predicted_aqi")
                        if pred_aqi is not None:
                            return float(pred_aqi), categorize_aqi(float(pred_aqi)), "predicted_lstm"

                # Otherwise run dynamic prediction if lookback sequence exists
                tables = influx_db.query_range(
                    measurement="air_quality",
                    city=closest_station.city,
                    start=f"-{settings.lstm_lookback_hours}h",
                    station_id=closest_station.station_id,
                )
                rows: list[dict] = []
                for table in tables:
                    for record in table.records:
                        rows.append({
                            "time": record.get_time(),
                            "field": record.get_field(),
                            "value": record.get_value(),
                        })

                if rows:
                    from collections import defaultdict
                    by_time: dict = defaultdict(dict)
                    for r in rows:
                        by_time[r["time"]][r["field"]] = r["value"]

                    sorted_times = sorted(by_time.keys())[-SEQ_LENGTH:]
                    if len(sorted_times) == SEQ_LENGTH:
                        sequence = [by_time[t] for t in sorted_times]
                        result = predict_aqi(closest_station.station_id, sequence)
                        return result["predicted_aqi"], result["category"], "predicted_lstm"
        except Exception as exc:
            log.warning("LSTM fallback failed for (%s, %s): %s", lat, lon, exc)

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

    for alt_idx, alt_data in enumerate(alternatives_raw):
        waypoints = alt_data["waypoints"]
        scored_wps: list[RouteWaypointOut] = []
        aqi_values: list[float] = []

        for wp in waypoints:
            aqi, category, source = _get_aqi_for_point(wp.latitude, wp.longitude, db)
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
                distance_m=alt_data.get("distance_m"),
                duration_s=alt_data.get("duration_s")
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
            provider="google" if settings.google_maps_api_key else "osrm",
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
