"""
Data-ingestion worker.

Responsibilities
────────────────
  1. Poll external air-quality APIs (OpenAQ, WAQI) on a configurable interval.
  2. Fetch matching meteorological data from OpenWeatherMap.
  3. Write normalised readings into InfluxDB (measurement: air_quality / weather).
  4. Upsert station metadata into Postgres so the /stations endpoint stays current.

Current status: scaffold with clearly marked TODO sections.
Run as:  python -m app.workers.main
"""
from __future__ import annotations

import asyncio
import logging
import signal
import sys

log = logging.getLogger(__name__)


# ── Ingestion tasks ───────────────────────────────────────────────────────────

async def ingest_openaq() -> None:
    """
    Fetch latest readings from the OpenAQ v3 API and write them to InfluxDB.

    TODO:
      - Use httpx.AsyncClient with settings.openaq_api_key.
      - Page through /v3/measurements for configured cities / parameters.
      - Normalise field names to match FEATURE_ORDER in ml_interface.
      - Write via influx_db.write_air_quality().
      - Upsert Station rows via SQLAlchemy SessionLocal.
    """
    log.info("[OpenAQ] ingestion tick — not yet implemented")


async def ingest_waqi() -> None:
    """
    Fetch latest readings from the World Air Quality Index API.

    TODO:
      - Use httpx.AsyncClient with settings.waqi_api_key.
      - Query /feed/<station_id>/ for each known station.
      - Map WAQI pollutant keys → FEATURE_ORDER names.
      - Write via influx_db.write_air_quality().
    """
    log.info("[WAQI] ingestion tick — not yet implemented")


async def ingest_weather() -> None:
    """
    Fetch current meteorological data from OpenWeatherMap for all active stations.

    TODO:
      - Use httpx.AsyncClient with settings.openweather_api_key.
      - Query /data/2.5/weather?lat=&lon= for each station coordinate.
      - Extract temperature, humidity, wind speed/direction.
      - Write via influx_db.write_weather().
    """
    log.info("[OpenWeather] ingestion tick — not yet implemented")


# ── Main loop ─────────────────────────────────────────────────────────────────

INGEST_INTERVAL_SECONDS = 300  # 5 minutes — adjust as needed

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
                ingest_weather(),
                return_exceptions=True,   # one failing task must not kill the others
            )
        except Exception:
            log.exception("Unexpected error in ingestion cycle.")

        try:
            await asyncio.wait_for(_shutdown.wait(), timeout=INGEST_INTERVAL_SECONDS)
        except asyncio.TimeoutError:
            pass  # normal — just means it's time for the next cycle

    log.info("Data-ingestion worker stopped.")


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        stream=sys.stdout,
    )
    asyncio.run(run())
