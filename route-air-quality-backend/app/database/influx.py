"""
InfluxDB 2.x client — singleton with lazy init, health-check, and typed helpers.

Measurements used by this project
──────────────────────────────────
  air_quality   raw sensor readings ingested from external APIs
  weather       meteorological readings (temperature, humidity, wind …)
  prediction    LSTM model output persisted after each /predict call
  route_score   per-waypoint AQI score written during route evaluation
"""
from __future__ import annotations

import logging

from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.exceptions import InfluxDBError
from influxdb_client.client.write_api import SYNCHRONOUS

from app.core.config import settings

log = logging.getLogger(__name__)

_client: InfluxDBClient | None = None


# ── Client lifecycle ──────────────────────────────────────────────────────────

def get_client() -> InfluxDBClient:
    """Return the singleton InfluxDB client, creating it on first call."""
    global _client
    if _client is None:
        _client = InfluxDBClient(
            url=settings.influx_url,
            token=settings.influx_token,
            org=settings.influx_org,
            timeout=10_000,       # ms — connection + read timeout
            enable_gzip=True,
        )
        log.info("InfluxDB client initialised → %s", settings.influx_url)
    return _client


def close_client() -> None:
    """Close the singleton client (call on app shutdown)."""
    global _client
    if _client is not None:
        _client.close()
        _client = None
        log.info("InfluxDB client closed.")


# ── Health check ──────────────────────────────────────────────────────────────

def ping() -> dict:
    """
    Ping InfluxDB and return a status dict.
    Never raises — always returns {"ok": bool, "detail": str}.
    """
    try:
        ready = get_client().ping()
        if ready:
            return {"ok": True, "detail": "InfluxDB is reachable"}
        return {"ok": False, "detail": "InfluxDB ping returned False"}
    except Exception as exc:
        return {"ok": False, "detail": str(exc)}


# ── Internal write helper ─────────────────────────────────────────────────────

def _write(point: Point) -> None:
    try:
        get_client().write_api(write_options=SYNCHRONOUS).write(
            bucket=settings.influx_bucket,
            record=point,
            write_precision=WritePrecision.NS,
        )
    except InfluxDBError as exc:
        log.error("InfluxDB write failed: %s", exc)
        raise


# ── Writers ───────────────────────────────────────────────────────────────────

def write_air_quality(
    city: str,
    station_id: str,
    source: str,
    fields: dict,
    interpolated: bool = False,
) -> None:
    """Persist a raw sensor reading for a station."""
    point = (
        Point("air_quality")
        .tag("city", city)
        .tag("station_id", station_id)
        .tag("source", source)
        .tag("interpolated", str(interpolated).lower())
    )
    for key, value in fields.items():
        if value is not None:
            point = point.field(key, float(value))
    _write(point)


def write_weather(city: str, station_id: str, source: str, fields: dict) -> None:
    """Persist a meteorological reading for a station."""
    point = (
        Point("weather")
        .tag("city", city)
        .tag("station_id", station_id)
        .tag("source", source)
    )
    for key, value in fields.items():
        if value is not None:
            point = point.field(key, float(value))
    _write(point)


def write_prediction(
    station_id: str,
    latitude: float,
    longitude: float,
    inputs: dict,
    predicted_aqi: float,
    category: str,
    model_version: str,
) -> None:
    """Persist an LSTM prediction result."""
    point = (
        Point("prediction")
        .tag("station_id", station_id)
        .tag("model_version", model_version)
        .tag("category", category)
        .field("latitude", latitude)
        .field("longitude", longitude)
        .field("predicted_aqi", predicted_aqi)
    )
    for key, value in inputs.items():
        if value is not None:
            point = point.field(key, float(value))
    _write(point)


def write_route_score(
    route_id: str,
    waypoint_index: int,
    latitude: float,
    longitude: float,
    aqi: float,
    category: str,
) -> None:
    """
    Persist the AQI score for one waypoint of a evaluated route.
    Allows historical route quality analysis and trend dashboards.
    """
    point = (
        Point("route_score")
        .tag("route_id", route_id)
        .tag("category", category)
        .field("waypoint_index", waypoint_index)
        .field("latitude", latitude)
        .field("longitude", longitude)
        .field("aqi", aqi)
    )
    _write(point)


# ── Queries ───────────────────────────────────────────────────────────────────

def query_latest(
    measurement: str,
    city: str,
    station_id: str | None = None,
) -> list:
    """Return the most-recent value for every field at a city (optionally filtered by station)."""
    station_filter = (
        f'|> filter(fn: (r) => r.station_id == "{station_id}")'
        if station_id
        else ""
    )
    flux = f"""
    from(bucket: "{settings.influx_bucket}")
      |> range(start: -24h)
      |> filter(fn: (r) => r._measurement == "{measurement}")
      |> filter(fn: (r) => r.city == "{city}")
      {station_filter}
      |> last()
    """
    return get_client().query_api().query(flux)


def query_range(
    measurement: str,
    city: str,
    start: str,
    stop: str = "now()",
    station_id: str | None = None,
) -> list:
    """Return a time-series slice for a measurement/city combo."""
    station_filter = (
        f'|> filter(fn: (r) => r.station_id == "{station_id}")'
        if station_id
        else ""
    )
    flux = f"""
    from(bucket: "{settings.influx_bucket}")
      |> range(start: {start}, stop: {stop})
      |> filter(fn: (r) => r._measurement == "{measurement}")
      |> filter(fn: (r) => r.city == "{city}")
      {station_filter}
    """
    return get_client().query_api().query(flux)


def query_predictions(station_id: str, start: str = "-7d") -> list:
    """Retrieve stored LSTM predictions for a station, pivoted into rows."""
    flux = f"""
    from(bucket: "{settings.influx_bucket}")
      |> range(start: {start})
      |> filter(fn: (r) => r._measurement == "prediction")
      |> filter(fn: (r) => r.station_id == "{station_id}")
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
    """
    return get_client().query_api().query(flux)


def query_nearest_station_aqi(
    latitude: float,
    longitude: float,
    radius_km: float = 2.0,
    start: str = "-1h",
) -> list:
    """
    Query the latest AQI reading from any station within `radius_km` of a
    coordinate pair.  Uses a bounding-box pre-filter on lat/lon fields, then
    the caller is expected to apply Haversine filtering on the result set.
    """
    lat_min = latitude - radius_km / 111.0
    lat_max = latitude + radius_km / 111.0
    lon_delta = radius_km / (111.0 * abs(round(1e-9 + abs(latitude) / 90, 6)) + 1e-9)
    lon_min = longitude - lon_delta
    lon_max = longitude + lon_delta

    flux = f"""
    from(bucket: "{settings.influx_bucket}")
      |> range(start: {start})
      |> filter(fn: (r) => r._measurement == "air_quality")
      |> filter(fn: (r) => r._field == "aqi")
      |> filter(fn: (r) => r.latitude >= {lat_min} and r.latitude <= {lat_max})
      |> filter(fn: (r) => r.longitude >= {lon_min} and r.longitude <= {lon_max})
      |> last()
    """
    return get_client().query_api().query(flux)
