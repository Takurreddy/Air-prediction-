"""
Analytics API — city-level summaries, trends, comparisons, pollutant breakdowns.

Endpoints
─────────
GET /api/analytics/summary             City-level AQI summary (avg, min, max, trend)
GET /api/analytics/top-polluted        Top N most polluted cities
GET /api/analytics/hourly-trend        Hourly AQI trend for a city (last 24h)
GET /api/analytics/comparison          Multi-city AQI comparison
GET /api/analytics/pollutant-breakdown Full pollutant grid for a city
GET /api/analytics/weekly-summary      7-day daily-avg AQI for a city (sparkline data)
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import influx as influx_db
from app.database.postgres import get_db
from app.models.station import Station
from app.services.ml_interface import categorize_aqi

log = logging.getLogger(__name__)

router = APIRouter()

# ── helpers ───────────────────────────────────────────────────────────────────

def _parse_influx_tables(tables: list, field_key: str = "aqi") -> dict[str, list[float]]:
    """Group field values by city from Influx query results."""
    by_city: dict[str, list[float]] = {}
    for table in tables:
        for record in table.records:
            city = record.values.get("city", "unknown")
            if record.get_field() == field_key:
                val = record.get_value()
                if val is not None:
                    by_city.setdefault(city, []).append(float(val))
    return by_city


def _safe_avg(values: list[float]) -> float | None:
    return round(sum(values) / len(values), 2) if values else None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/summary")
def city_summary(
    city: str = Query(..., description="City name"),
    hours: int = Query(24, ge=1, le=168, description="Lookback window in hours"),
):
    """AQI summary for a single city: avg, min, max, latest, trend direction."""
    tables = influx_db.query_range("air_quality", city=city, start=f"-{hours}h")
    values: list[float] = []
    timestamps: list[tuple[datetime, float]] = []

    for table in tables:
        for record in table.records:
            if record.get_field() == "aqi":
                val = record.get_value()
                if val is not None:
                    values.append(float(val))
                    timestamps.append((record.get_time(), float(val)))

    if not values:
        return {"city": city, "avg_aqi": None, "min_aqi": None, "max_aqi": None,
                "latest_aqi": None, "trend": "stable", "data_points": 0}

    timestamps.sort(key=lambda x: x[0])
    latest = timestamps[-1][1]

    # Simple trend: compare first-half avg to second-half avg
    mid = len(values) // 2
    first_half = _safe_avg(values[:mid]) or latest
    second_half = _safe_avg(values[mid:]) or latest
    if second_half > first_half * 1.05:
        trend = "rising"
    elif second_half < first_half * 0.95:
        trend = "falling"
    else:
        trend = "stable"

    return {
        "city": city,
        "avg_aqi": _safe_avg(values),
        "min_aqi": round(min(values), 2),
        "max_aqi": round(max(values), 2),
        "latest_aqi": round(latest, 2),
        "trend": trend,
        "category": categorize_aqi(latest),
        "data_points": len(values),
    }


@router.get("/top-polluted")
def top_polluted(
    n: int = Query(10, ge=1, le=50, description="Number of cities to return"),
    db: Session = Depends(get_db),
):
    """Return the top N most polluted cities based on latest AQI readings."""
    cities = (
        db.query(Station.city)
        .filter(Station.is_active.is_(True))
        .distinct()
        .all()
    )
    city_names = [c[0] for c in cities]

    results = []
    for city_name in city_names:
        try:
            tables = influx_db.query_latest("air_quality", city=city_name)
            for table in tables:
                for record in table.records:
                    if record.get_field() == "aqi":
                        val = record.get_value()
                        if val is not None:
                            results.append({
                                "city": city_name,
                                "aqi": round(float(val), 2),
                                "category": categorize_aqi(float(val)),
                                "timestamp": record.get_time().isoformat(),
                            })
                            break
                else:
                    continue
                break
        except Exception:
            log.debug("Skipping city %s in top-polluted", city_name)
            continue

    results.sort(key=lambda x: x["aqi"], reverse=True)
    return results[:n]


@router.get("/hourly-trend")
def hourly_trend(
    city: str = Query(..., description="City name"),
    hours: int = Query(24, ge=1, le=72, description="Lookback window"),
):
    """Hourly AQI readings for a city, suitable for chart rendering."""
    tables = influx_db.query_range("air_quality", city=city, start=f"-{hours}h")
    points: list[dict] = []

    for table in tables:
        for record in table.records:
            if record.get_field() == "aqi":
                val = record.get_value()
                if val is not None:
                    points.append({
                        "time": record.get_time().isoformat(),
                        "aqi": round(float(val), 2),
                        "station_id": record.values.get("station_id"),
                    })

    points.sort(key=lambda x: x["time"])
    return {"city": city, "hours": hours, "data": points}


@router.get("/comparison")
def city_comparison(
    cities: str = Query(..., description="Comma-separated city names"),
):
    """Latest AQI side-by-side comparison for multiple cities."""
    city_list = [c.strip() for c in cities.split(",") if c.strip()]
    results = []

    for city_name in city_list:
        try:
            tables = influx_db.query_latest("air_quality", city=city_name)
            entry: dict = {"city": city_name, "aqi": None, "category": None}
            for table in tables:
                for record in table.records:
                    field = record.get_field()
                    val = record.get_value()
                    if field == "aqi" and val is not None:
                        entry["aqi"] = round(float(val), 2)
                        entry["category"] = categorize_aqi(float(val))
                    elif field in ("pm25", "pm10", "no2", "so2", "co", "o3",
                                   "temperature", "humidity", "wind_speed"):
                        entry[field] = round(float(val), 2) if val is not None else None
            results.append(entry)
        except Exception:
            results.append({"city": city_name, "aqi": None, "error": "Data unavailable"})

    return results


@router.get("/pollutant-breakdown")
def pollutant_breakdown(
    city: str = Query(..., description="City name"),
    station_id: str | None = Query(None, description="Optional station filter"),
):
    """Full pollutant grid: PM2.5, PM10, CO, NO₂, SO₂, O₃ plus met data."""
    tables = influx_db.query_latest(
        "air_quality", city=city, station_id=station_id
    )

    pollutants: dict[str, dict] = {}
    for table in tables:
        for record in table.records:
            sid = record.values.get("station_id", "unknown")
            entry = pollutants.setdefault(sid, {"station_id": sid, "city": city})
            field = record.get_field()
            val = record.get_value()
            if val is not None:
                entry[field] = round(float(val), 4)

    return list(pollutants.values())


@router.get("/weekly-summary")
def weekly_summary(
    city: str = Query(..., description="City name"),
):
    """7-day daily average AQI — suitable for sparkline charts."""
    tables = influx_db.query_range("air_quality", city=city, start="-7d")

    # Bucket by date
    by_date: dict[str, list[float]] = {}
    for table in tables:
        for record in table.records:
            if record.get_field() == "aqi":
                val = record.get_value()
                if val is not None:
                    day_key = record.get_time().strftime("%Y-%m-%d")
                    by_date.setdefault(day_key, []).append(float(val))

    daily = []
    for day in sorted(by_date.keys()):
        vals = by_date[day]
        daily.append({
            "date": day,
            "avg_aqi": round(sum(vals) / len(vals), 2),
            "min_aqi": round(min(vals), 2),
            "max_aqi": round(max(vals), 2),
        })

    return {"city": city, "daily": daily}
