"""
Data Hydration Script.

Populates Postgres with default monitoring stations and seeds 24 hours of
hourly sensor sequence data + LSTM predictions into InfluxDB so lookback
sequences are ready immediately for predictions and route scoring.
"""
from __future__ import annotations

import logging
import random
import sys
from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.database import influx as influx_db
from app.database.postgres import Base, engine, SessionLocal
from app.models.station import Station
from app.services.ml_interface import FEATURE_ORDER, categorize_aqi, predict_aqi

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("seed_historical_data")

DEFAULT_STATIONS = [
    {"station_id": "cpcb-delhi-ito",            "city": "Delhi",         "lat": 28.6289, "lon": 77.2410, "source": "cpcb"},
    {"station_id": "cpcb-delhi-rkpuram",        "city": "Delhi",         "lat": 28.5632, "lon": 77.1869, "source": "cpcb"},
    {"station_id": "cpcb-mumbai-bandra",        "city": "Mumbai",        "lat": 19.0596, "lon": 72.8295, "source": "cpcb"},
    {"station_id": "cpcb-mumbai-worli",         "city": "Mumbai",        "lat": 19.0176, "lon": 72.8172, "source": "cpcb"},
    {"station_id": "cpcb-bangalore-peenya",     "city": "Bengaluru",     "lat": 13.0285, "lon": 77.5197, "source": "cpcb"},
    {"station_id": "cpcb-bangalore-bapuji",     "city": "Bengaluru",     "lat": 12.9580, "lon": 77.5380, "source": "cpcb"},
    {"station_id": "cpcb-hyderabad-sanath",     "city": "Hyderabad",     "lat": 17.4568, "lon": 78.4439, "source": "cpcb"},
    {"station_id": "cpcb-chennai-alandur",      "city": "Chennai",       "lat": 13.0012, "lon": 80.2015, "source": "cpcb"},
    {"station_id": "cpcb-kolkata-victoria",     "city": "Kolkata",       "lat": 22.5448, "lon": 88.3426, "source": "cpcb"},
    {"station_id": "cpcb-ahmedabad-maninagar",  "city": "Ahmedabad",     "lat": 23.0010, "lon": 72.6010, "source": "cpcb"},
    {"station_id": "cpcb-pune-karvenagar",      "city": "Pune",          "lat": 18.4900, "lon": 73.8200, "source": "cpcb"},
    {"station_id": "cpcb-jaipur-mansarovar",    "city": "Jaipur",        "lat": 26.8600, "lon": 75.7600, "source": "cpcb"},
    {"station_id": "cpcb-lucknow-talkatora",    "city": "Lucknow",       "lat": 26.8300, "lon": 80.9000, "source": "cpcb"},
    {"station_id": "cpcb-surat-limbayat",       "city": "Surat",         "lat": 21.1800, "lon": 72.8500, "source": "cpcb"},
    {"station_id": "cpcb-visakhapatnam-gaju",   "city": "Visakhapatnam", "lat": 17.6900, "lon": 83.2000, "source": "cpcb"},
]



def seed_postgres_stations() -> list[Station]:
    """Ensure Postgres tables are created and default stations exist."""
    log.info("Ensuring database tables exist...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    stations: list[Station] = []
    try:
        for info in DEFAULT_STATIONS:
            station = db.query(Station).filter(Station.station_id == info["station_id"]).first()
            if not station:
                station = Station(
                    station_id=info["station_id"],
                    city=info["city"],
                    latitude=info["lat"],
                    longitude=info["lon"],
                    source_api=info["source"],
                    is_active=True,
                )
                db.add(station)
                log.info("Added station to Postgres: %s (%s)", station.station_id, station.city)
            stations.append(station)
        db.commit()
    except Exception as exc:
        log.warning("Postgres station seed warning: %s", exc)
        db.rollback()
    finally:
        db.close()
    return stations


def generate_station_readings(station: dict, hours_back: int = 30) -> None:
    """Generate and write hourly readings into InfluxDB for the past N hours."""
    now = datetime.now(timezone.utc)
    base_pm25 = random.uniform(30.0, 90.0)

    for h in range(hours_back, -1, -1):
        ts = now - timedelta(hours=h)
        
        # Diurnal fluctuation
        hour_factor = 1.0 + 0.3 * (1.0 if 7 <= ts.hour <= 10 or 18 <= ts.hour <= 22 else -0.2)
        pm25 = max(5.0, base_pm25 * hour_factor + random.uniform(-5.0, 5.0))
        pm10 = pm25 * random.uniform(1.4, 2.0)
        no2 = max(2.0, pm25 * random.uniform(0.3, 0.6))
        so2 = max(1.0, pm25 * random.uniform(0.1, 0.3))
        no = max(1.0, no2 * random.uniform(0.2, 0.5))
        nox = no + no2
        nh3 = max(1.0, pm25 * random.uniform(0.1, 0.4))

        fields = {
            "PM2.5": round(pm25, 2),
            "PM10": round(pm10, 2),
            "NO": round(no, 2),
            "NO2": round(no2, 2),
            "NOX": round(nox, 2),
            "NH3": round(nh3, 2),
            "SO2": round(so2, 2),
            "RH": round(random.uniform(40.0, 80.0), 1),
            "WD": round(random.uniform(0.0, 360.0), 1),
            "AT": round(random.uniform(20.0, 35.0), 1),
            "WS": round(random.uniform(0.5, 5.0), 1),
            "Hour": float(ts.hour),
            "DayOfWeek": float(ts.weekday()),
            "Month": float(ts.month),
            "WD ": round(random.uniform(0.0, 360.0), 1),
            "latitude": station["lat"],
            "longitude": station["lon"],
            "aqi": round(pm25 * 1.2, 1),
        }

        try:
            influx_db.write_air_quality(
                city=station["city"],
                station_id=station["station_id"],
                source=station["source"],
                fields=fields,
            )
        except Exception as exc:
            log.warning("Failed to write InfluxDB record for %s: %s", station["station_id"], exc)


def seed_predictions(stations: list[dict]) -> None:
    """Run initial predictions for seeded stations and write to InfluxDB."""
    for st in stations:
        try:
            # Build mock sequence of 24 timesteps
            sequence = []
            now = datetime.now(timezone.utc)
            for i in range(24):
                ts = now - timedelta(hours=23 - i)
                sequence.append({
                    "PM2.5": round(random.uniform(35.0, 75.0), 2),
                    "PM10": round(random.uniform(60.0, 120.0), 2),
                    "NO": round(random.uniform(5.0, 25.0), 2),
                    "NO2": round(random.uniform(15.0, 45.0), 2),
                    "NOX": round(random.uniform(20.0, 70.0), 2),
                    "NH3": round(random.uniform(5.0, 20.0), 2),
                    "SO2": round(random.uniform(5.0, 15.0), 2),
                    "RH": round(random.uniform(45.0, 75.0), 1),
                    "WD": round(random.uniform(0.0, 360.0), 1),
                    "AT": round(random.uniform(22.0, 32.0), 1),
                    "WS": round(random.uniform(1.0, 4.0), 1),
                    "Hour": float(ts.hour),
                    "DayOfWeek": float(ts.weekday()),
                    "Month": float(ts.month),
                    "WD ": round(random.uniform(0.0, 360.0), 1),
                })

            result = predict_aqi(st["station_id"], sequence)
            influx_db.write_prediction(
                station_id=st["station_id"],
                latitude=st["lat"],
                longitude=st["lon"],
                inputs={k: result[k] for k in ("pm25", "pm10", "no2", "so2")},
                predicted_aqi=result["predicted_aqi"],
                category=result["category"],
                model_version=result["model_version"],
            )
            log.info("Seeded prediction for %s: AQI=%.1f (%s, model=%s)", st["station_id"], result["predicted_aqi"], result["category"], result["model_version"])
        except Exception as exc:
            log.warning("Prediction seed failed for %s: %s", st["station_id"], exc)


def main() -> None:
    log.info("Starting historical data seed...")
    seed_postgres_stations()

    for st in DEFAULT_STATIONS:
        log.info("Seeding InfluxDB 30-hour sensor readings for %s...", st["station_id"])
        generate_station_readings(st, hours_back=30)

    log.info("Seeding initial LSTM predictions...")
    seed_predictions(DEFAULT_STATIONS)
    log.info("Data hydration completed successfully.")


if __name__ == "__main__":
    main()
