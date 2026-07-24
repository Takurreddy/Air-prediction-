"""
Data-ingestion worker.

Fetches live AQI readings every 5 minutes from:
  - OpenAQ v3 API
  - WAQI (World Air Quality Index)
  - CPCB via data.gov.in

Writes normalised readings into InfluxDB and upserts station metadata in Postgres.
"""
from __future__ import annotations

import asyncio
import logging
import signal
import sys
from datetime import datetime, timezone

import httpx

from app.core.config import settings
from app.database import influx as influx_db
from app.database.postgres import SessionLocal
from app.models.station import Station

log = logging.getLogger(__name__)

INGEST_INTERVAL_SECONDS = 300  # 5 minutes

# Indian cities to monitor
TARGET_CITIES = [
    {"name": "Delhi",     "lat": 28.6139, "lon": 77.2090},
    {"name": "Mumbai",    "lat": 19.0760, "lon": 72.8777},
    {"name": "Bangalore", "lat": 12.9716, "lon": 77.5946},
    {"name": "Hyderabad", "lat": 17.3850, "lon": 78.4867},
    {"name": "Chennai",   "lat": 13.0827, "lon": 80.2707},
    {"name": "Kolkata",   "lat": 22.5726, "lon": 88.3639},
]

# WAQI station UIDs for Indian cities
WAQI_STATIONS = [
    {"station_id": "waqi-delhi",     "city": "Delhi",     "uid": "@7021"},
    {"station_id": "waqi-mumbai",    "city": "Mumbai",    "uid": "@3987"},
    {"station_id": "waqi-bangalore", "city": "Bangalore", "uid": "@8529"},
    {"station_id": "waqi-hyderabad", "city": "Hyderabad", "uid": "@9477"},
    {"station_id": "waqi-chennai",   "city": "Chennai",   "uid": "@8530"},
    {"station_id": "waqi-kolkata",   "city": "Kolkata",   "uid": "@8531"},
]

# CPCB data.gov.in resource ID for real-time AQI
CPCB_RESOURCE_ID = "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69"


def _upsert_station(city: str, station_id: str, lat: float, lon: float, source: str) -> None:
    """Insert or update a station row in Postgres."""
    try:
        db = SessionLocal()
        existing = db.query(Station).filter(Station.station_id == station_id).first()
        if not existing:
            db.add(Station(
                station_id=station_id,
                city=city,
                latitude=lat,
                longitude=lon,
                source_api=source,
                is_active=True,
            ))
            db.commit()
            log.info("Station upserted: %s", station_id)
        db.close()
    except Exception as exc:
        log.warning("Station upsert failed for %s: %s", station_id, exc)


def _map_aqi_fields(raw: dict) -> dict:
    """Map raw pollutant keys to FEATURE_ORDER field names."""
    mapping = {
        "pm25": "PM2.5", "pm2.5": "PM2.5",
        "pm10": "PM10",
        "no2":  "NO2",
        "so2":  "SO2",
        "no":   "NO",
        "nox":  "NOX",
        "nh3":  "NH3",
        "co":   "CO",
        "o3":   "O3",
    }
    fields = {}
    for k, v in raw.items():
        key = mapping.get(k.lower().replace(".", "").replace(" ", ""))
        if key and v is not None:
            try:
                fields[key] = float(v)
            except (ValueError, TypeError):
                pass
    return fields


async def ingest_openaq() -> None:
    """Fetch latest readings from OpenAQ v3 API."""
    if not settings.openaq_api_key:
        return

    headers = {"X-API-Key": settings.openaq_api_key}
    async with httpx.AsyncClient(timeout=30) as client:
        for city in TARGET_CITIES:
            try:
                resp = await client.get(
                    "https://api.openaq.org/v3/locations",
                    headers=headers,
                    params={
                        "coordinates": f"{city['lat']},{city['lon']}",
                        "radius": 25000,
                        "limit": 5,
                    },
                )
                resp.raise_for_status()
                locations = resp.json().get("results", [])

                for loc in locations:
                    station_id = f"openaq-{loc['id']}"
                    lat = loc.get("coordinates", {}).get("latitude", city["lat"])
                    lon = loc.get("coordinates", {}).get("longitude", city["lon"])
                    _upsert_station(city["name"], station_id, lat, lon, "openaq")

                    # Fetch latest measurements for this location
                    meas_resp = await client.get(
                        f"https://api.openaq.org/v3/locations/{loc['id']}/latest",
                        headers=headers,
                    )
                    meas_resp.raise_for_status()
                    measurements = meas_resp.json().get("results", [])

                    raw = {m["parameter"]: m["value"] for m in measurements}
                    fields = _map_aqi_fields(raw)

                    if fields:
                        now = datetime.now(timezone.utc)
                        fields["Hour"] = float(now.hour)
                        fields["DayOfWeek"] = float(now.weekday())
                        fields["Month"] = float(now.month)
                        influx_db.write_air_quality(city["name"], station_id, "openaq", fields)
                        log.info("[OpenAQ] wrote %d fields for %s", len(fields), station_id)

            except Exception as exc:
                log.warning("[OpenAQ] %s failed: %s", city["name"], exc)


async def ingest_waqi() -> None:
    """Fetch latest readings from WAQI API."""
    if not settings.waqi_api_key:
        return

    async with httpx.AsyncClient(timeout=30) as client:
        for station in WAQI_STATIONS:
            try:
                resp = await client.get(
                    f"https://api.waqi.info/feed/{station['uid']}/",
                    params={"token": settings.waqi_api_key},
                )
                resp.raise_for_status()
                data = resp.json().get("data", {})

                if not data or data == "Unknown station":
                    continue

                geo = data.get("city", {}).get("geo", [0, 0])
                lat, lon = float(geo[0]), float(geo[1])
                _upsert_station(station["city"], station["station_id"], lat, lon, "waqi")

                iaqi = data.get("iaqi", {})
                raw = {k: v.get("v") for k, v in iaqi.items() if isinstance(v, dict)}
                fields = _map_aqi_fields(raw)

                if fields:
                    now = datetime.now(timezone.utc)
                    fields["Hour"] = float(now.hour)
                    fields["DayOfWeek"] = float(now.weekday())
                    fields["Month"] = float(now.month)
                    # Store overall AQI index too
                    aqi_val = data.get("aqi")
                    if aqi_val and str(aqi_val).isdigit():
                        fields["aqi"] = float(aqi_val)
                    influx_db.write_air_quality(
                        station["city"], station["station_id"], "waqi", fields
                    )
                    log.info("[WAQI] wrote %d fields for %s", len(fields), station["station_id"])

            except Exception as exc:
                log.warning("[WAQI] %s failed: %s", station["station_id"], exc)


async def ingest_cpcb() -> None:
    """Fetch real-time AQI data from CPCB via data.gov.in."""
    if not settings.cpcb_api_key:
        return

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.get(
                "https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69",
                params={
                    "api-key": settings.cpcb_api_key,
                    "format": "json",
                    "limit": 100,
                },
            )
            resp.raise_for_status()
            records = resp.json().get("records", [])

            for rec in records:
                city = rec.get("city", "Unknown")
                station_name = rec.get("station", rec.get("stationname", "unknown"))
                station_id = f"cpcb-{city.lower().replace(' ', '-')}-{station_name.lower().replace(' ', '-')[:20]}"

                try:
                    lat = float(rec.get("latitude") or rec.get("lat") or 0)
                    lon = float(rec.get("longitude") or rec.get("lon") or 0)
                except (ValueError, TypeError):
                    lat, lon = 0.0, 0.0

                if lat and lon:
                    _upsert_station(city, station_id, lat, lon, "cpcb")  # noqa: E501

                raw = {
                    "pm25": rec.get("pm2_5") or rec.get("pm25"),
                    "pm10": rec.get("pm10"),
                    "no2":  rec.get("no2"),
                    "so2":  rec.get("so2"),
                    "nh3":  rec.get("nh3"),
                    "co":   rec.get("co"),
                    "o3":   rec.get("ozone") or rec.get("o3"),
                }
                fields = _map_aqi_fields(raw)

                aqi_val = rec.get("aqi") or rec.get("air_quality_index")
                if aqi_val:
                    try:
                        fields["aqi"] = float(aqi_val)
                    except (ValueError, TypeError):
                        pass

                if fields:
                    now = datetime.now(timezone.utc)
                    fields["Hour"] = float(now.hour)
                    fields["DayOfWeek"] = float(now.weekday())
                    fields["Month"] = float(now.month)
                    influx_db.write_air_quality(city, station_id, "cpcb", fields)

            log.info("[CPCB] wrote %d station records", len(records))

        except Exception as exc:
            log.warning("[CPCB] ingestion failed: %s", exc)


# ── Main loop ─────────────────────────────────────────────────────────────────

_shutdown = asyncio.Event()


def _handle_signal(signum, frame):  # noqa: ANN001
    log.info("Worker received signal %s — shutting down.", signum)
    _shutdown.set()


async def run() -> None:
    signal.signal(signal.SIGTERM, _handle_signal)
    signal.signal(signal.SIGINT, _handle_signal)

    log.info("Data-ingestion worker started (interval=%ds).", INGEST_INTERVAL_SECONDS)

    while not _shutdown.is_set():
        try:
            await asyncio.gather(
                ingest_openaq(),
                ingest_waqi(),
                ingest_cpcb(),
                return_exceptions=True,
            )
        except Exception:
            log.exception("Unexpected error in ingestion cycle.")

        try:
            await asyncio.wait_for(_shutdown.wait(), timeout=INGEST_INTERVAL_SECONDS)
        except asyncio.TimeoutError:
            pass

    log.info("Data-ingestion worker stopped.")


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        stream=sys.stdout,
    )
    asyncio.run(run())
