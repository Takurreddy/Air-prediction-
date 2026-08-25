"""
Map API — city markers with live AQI, heatmap data, India GeoJSON, station details.

Endpoints
─────────
GET /api/map/cities            All monitored cities with current AQI + coordinates
GET /api/map/heatmap           AQI heatmap data grid for India
GET /api/map/geojson/india     India boundary GeoJSON (simplified)
GET /api/map/stations/{city}   All stations in a city with live readings
"""
from __future__ import annotations

import json
import logging
import os

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import influx as influx_db
from app.database.postgres import get_db
from app.models.station import Station
from app.services.ml_interface import categorize_aqi

log = logging.getLogger(__name__)

router = APIRouter()

# ── India GeoJSON (simplified boundary) ──────────────────────────────────────
# Stored as a module-level constant; in production you'd serve a static file.

_INDIA_GEOJSON_PATH = os.path.join(os.path.dirname(__file__), "india_boundary.geojson")

# Simplified India boundary polygon (major outline points)
# This is a highly simplified version suitable for overlay rendering
_INDIA_BOUNDARY_GEOJSON = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {"name": "India", "ISO_A3": "IND"},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [68.17, 7.97], [69.66, 22.09], [68.84, 24.36], [71.04, 24.36],
                    [70.84, 25.22], [70.28, 25.72], [70.17, 26.49], [69.51, 26.94],
                    [70.62, 28.02], [71.78, 27.91], [72.82, 28.96], [73.45, 29.98],
                    [74.42, 30.98], [74.41, 31.69], [75.26, 32.27], [74.45, 32.76],
                    [74.10, 33.44], [73.75, 34.32], [74.24, 34.75], [75.76, 34.50],
                    [76.87, 34.65], [77.84, 35.49], [78.91, 34.32], [78.81, 33.51],
                    [79.21, 32.50], [79.18, 31.02], [80.68, 30.77], [81.11, 30.18],
                    [80.48, 29.73], [80.09, 28.79], [81.06, 28.42], [82.00, 27.93],
                    [83.30, 27.36], [84.67, 27.23], [85.25, 26.73], [86.02, 26.63],
                    [87.23, 26.40], [88.06, 26.41], [88.17, 26.81], [88.04, 27.45],
                    [88.73, 28.09], [88.81, 27.30], [89.28, 26.01], [89.83, 25.97],
                    [89.92, 25.27], [90.87, 25.13], [91.80, 25.15], [92.38, 25.07],
                    [93.30, 24.08], [93.33, 23.04], [93.09, 22.70], [93.17, 22.28],
                    [92.67, 22.04], [92.15, 21.53], [92.10, 21.06], [92.33, 20.92],
                    [92.08, 21.19], [91.99, 22.50], [91.16, 22.82], [90.59, 23.27],
                    [90.27, 21.84], [89.85, 22.04], [89.70, 21.86], [89.09, 21.87],
                    [88.21, 21.70], [86.98, 21.50], [87.03, 21.61], [86.56, 19.83],
                    [85.43, 19.89], [84.76, 19.61], [83.94, 18.30], [83.19, 17.67],
                    [82.19, 17.02], [82.19, 16.56], [81.69, 16.31], [80.79, 15.95],
                    [80.32, 15.90], [80.03, 14.52], [80.23, 13.84], [80.29, 13.01],
                    [79.86, 12.06], [79.86, 10.31], [79.34, 10.31], [78.89, 9.55],
                    [79.19, 9.22], [78.28, 8.93], [77.94, 8.25], [77.54, 7.97],
                    [76.59, 8.90], [76.13, 10.30], [75.75, 11.31], [75.40, 11.78],
                    [74.86, 12.74], [74.62, 13.99], [74.44, 14.62], [73.53, 15.99],
                    [73.12, 17.93], [72.82, 19.21], [72.82, 20.42], [72.63, 21.36],
                    [71.18, 20.76], [70.47, 20.88], [69.16, 22.09], [68.17, 7.97],
                ]],
            },
        }
    ],
}


@router.get("/cities")
def map_cities(db: Session = Depends(get_db)):
    """All monitored cities with latest AQI, coordinates, and station count."""
    # Group stations by city to get avg lat/lng and count
    city_data = (
        db.query(
            Station.city,
            func.avg(Station.latitude).label("lat"),
            func.avg(Station.longitude).label("lng"),
            func.count(Station.id).label("station_count"),
        )
        .filter(Station.is_active.is_(True))
        .group_by(Station.city)
        .all()
    )

    results = []
    for row in city_data:
        city_name, lat, lng, count = row
        entry: dict[str, Any] = {
            "city": city_name,
            "latitude": round(float(lat), 4),
            "longitude": round(float(lng), 4),
            "station_count": count,
            "aqi": None,
            "category": None,
        }

        # Fetch latest AQI from InfluxDB
        try:
            tables = influx_db.query_latest("air_quality", city=city_name)
            aqi_values = []
            for table in tables:
                for record in table.records:
                    if record.get_field() == "aqi":
                        val = record.get_value()
                        if val is not None:
                            aqi_values.append(float(val))

            if aqi_values:
                avg_aqi = round(sum(aqi_values) / len(aqi_values), 2)
                entry["aqi"] = avg_aqi
                entry["category"] = categorize_aqi(avg_aqi)
        except Exception:
            log.debug("Could not fetch AQI for city %s", city_name)

        results.append(entry)

    return results


@router.get("/heatmap")
def heatmap_data(
    hours: int = Query(1, ge=1, le=24, description="Lookback window"),
    db: Session = Depends(get_db),
):
    """AQI heatmap data: list of {lat, lng, aqi} points for all stations."""
    stations = db.query(Station).filter(Station.is_active.is_(True)).all()

    points = []
    for s in stations:
        try:
            tables = influx_db.query_latest(
                "air_quality", city=s.city, station_id=s.station_id
            )
            for table in tables:
                for record in table.records:
                    if record.get_field() == "aqi":
                        val = record.get_value()
                        if val is not None:
                            points.append({
                                "latitude": s.latitude,
                                "longitude": s.longitude,
                                "aqi": round(float(val), 2),
                                "station_id": s.station_id,
                                "city": s.city,
                            })
                            break
                else:
                    continue
                break
        except Exception:
            continue

    return {"points": points, "count": len(points)}


@router.get("/geojson/india")
def india_geojson():
    """
    Simplified India boundary GeoJSON for map overlay rendering.
    Returns a FeatureCollection with a single Polygon feature.
    """
    # Try to load from file first (if a detailed GeoJSON was placed alongside)
    if os.path.exists(_INDIA_GEOJSON_PATH):
        try:
            with open(_INDIA_GEOJSON_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            log.warning("Failed to load %s, falling back to built-in", _INDIA_GEOJSON_PATH)

    return _INDIA_BOUNDARY_GEOJSON


@router.get("/stations/{city}")
def city_stations(
    city: str = Path(..., description="City name"),
    db: Session = Depends(get_db),
):
    """All stations in a city with their latest readings."""
    stations = (
        db.query(Station)
        .filter(Station.city.ilike(f"%{city}%"), Station.is_active.is_(True))
        .all()
    )

    if not stations:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No stations found for city '{city}'.",
        )

    results = []
    for s in stations:
        entry: dict[str, Any] = {
            "station_id": s.station_id,
            "name": s.name,
            "city": s.city,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "readings": {},
        }

        try:
            tables = influx_db.query_latest(
                "air_quality", city=s.city, station_id=s.station_id
            )
            for table in tables:
                for record in table.records:
                    field = record.get_field()
                    val = record.get_value()
                    if val is not None:
                        entry["readings"][field] = round(float(val), 4)
        except Exception:
            log.debug("Could not fetch readings for station %s", s.station_id)

        results.append(entry)

    return results
