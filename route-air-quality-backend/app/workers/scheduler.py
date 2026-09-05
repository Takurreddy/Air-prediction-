"""
Scheduled-task worker.

Tasks:
  1. Proactive LSTM predictions for all active stations every hour
  2. Alert threshold evaluation every 10 minutes → Firebase push / email
  3. Stale data purge every 24 hours
"""
from __future__ import annotations

import asyncio
import logging
import signal
import sys
import uuid
from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.database import influx as influx_db
from app.database.postgres import SessionLocal
from app.models.alert import Alert
from app.models.station import Station
from app.services.alert_service import dispatch_threshold_alert
from app.services.ml_interface import FEATURE_ORDER, SEQ_LENGTH, predict_aqi

log = logging.getLogger(__name__)

PREDICTION_INTERVAL = 3_600   # 1 hour
ALERT_EVAL_INTERVAL = 600     # 10 minutes
PURGE_INTERVAL      = 86_400  # 24 hours

_shutdown = asyncio.Event()


# ── Task 1: Proactive predictions ─────────────────────────────────────────────

async def run_predictions_for_all_stations() -> None:
    """Fetch last 24h readings per station, run LSTM, store prediction."""
    db = SessionLocal()
    try:
        stations = db.query(Station).filter(Station.is_active.is_(True)).all()
        log.info("[Scheduler] Running predictions for %d stations.", len(stations))

        for station in stations:
            try:
                tables = influx_db.query_range(
                    measurement="air_quality",
                    city=station.city,
                    start=f"-{settings.lstm_lookback_hours}h",
                    station_id=station.station_id,
                )

                rows: list[dict] = []
                for table in tables:
                    for record in table.records:
                        field = record.get_field()
                        value = record.get_value()
                        time  = record.get_time()
                        rows.append({"time": time, "field": field, "value": value})

                if not rows:
                    continue

                # Group by timestamp → build sequence dicts
                from collections import defaultdict
                by_time: dict = defaultdict(dict)
                for r in rows:
                    by_time[r["time"]][r["field"]] = r["value"]

                sorted_times = sorted(by_time.keys())[-SEQ_LENGTH:]
                if len(sorted_times) < SEQ_LENGTH:
                    continue  # not enough data yet

                sequence = [by_time[t] for t in sorted_times]

                result = predict_aqi(station.station_id, sequence)

                influx_db.write_prediction(
                    station_id=station.station_id,
                    latitude=station.latitude,
                    longitude=station.longitude,
                    inputs={k: result[k] for k in ("pm25", "pm10", "no2", "so2")},
                    predicted_aqi=result["predicted_aqi"],
                    category=result["category"],
                    model_version=result["model_version"],
                )
                log.info(
                    "[Scheduler] Prediction for %s: AQI=%.1f (%s)",
                    station.station_id, result["predicted_aqi"], result["category"],
                )

            except Exception as exc:
                log.warning("[Scheduler] Prediction failed for %s: %s", station.station_id, exc)

    finally:
        db.close()


# ── Task 2: Alert threshold evaluation ────────────────────────────────────────

async def evaluate_alert_thresholds() -> None:
    """Check all active alerts against latest predictions, fire if breached."""
    db = SessionLocal()
    try:
        alerts = db.query(Alert).filter(Alert.is_active.is_(True)).all()
        if not alerts:
            return

        log.info("[Scheduler] Evaluating %d active alerts.", len(alerts))
        now = datetime.now(timezone.utc)
        cooldown = timedelta(hours=1)  # don't re-fire within 1 hour

        for alert in alerts:
            try:
                # Skip if fired recently
                if alert.last_triggered_at and (now - alert.last_triggered_at) < cooldown:
                    continue

                # Get latest prediction for this station
                tables = influx_db.query_predictions(
                    station_id=alert.station_id, start="-2h"
                )
                latest_aqi: float | None = None
                latest_category: str = "Unknown"

                for table in tables:
                    for record in table.records:
                        aqi_val = record.values.get("predicted_aqi")
                        cat_val = record.values.get("category", "Unknown")
                        if aqi_val is not None:
                            latest_aqi = float(aqi_val)
                            latest_category = str(cat_val)

                if latest_aqi is None or latest_aqi < alert.threshold_aqi:
                    continue

                # Threshold breached — get user details
                from app.models.user import User
                user = db.query(User).filter(User.id == alert.user_id).first()
                if not user:
                    continue

                fcm_token = (user.notification_prefs or {}).get("fcm_token")

                dispatch_threshold_alert(
                    db=db,
                    user_id=user.id,
                    user_email=user.email,
                    user_phone=user.phone_number,
                    station_id=alert.station_id,
                    aqi=latest_aqi,
                    category=latest_category,
                    notify_email=alert.notify_email,
                )

                alert.last_triggered_at = now
                db.commit()

                log.info(
                    "[Scheduler] Alert fired for user=%s station=%s AQI=%.1f",
                    alert.user_id, alert.station_id, latest_aqi,
                )

            except Exception as exc:
                log.warning("[Scheduler] Alert eval failed for alert %s: %s", alert.id, exc)

    finally:
        db.close()


# ── Task 3: Stale data purge ──────────────────────────────────────────────────

async def purge_stale_data() -> None:
    """Remove old route queries and inactive alerts."""
    db = SessionLocal()
    try:
        from app.models.route import RouteQuery
        cutoff = datetime.now(timezone.utc) - timedelta(days=30)

        deleted_routes = (
            db.query(RouteQuery)
            .filter(RouteQuery.created_at < cutoff)
            .delete(synchronize_session=False)
        )
        deleted_alerts = (
            db.query(Alert)
            .filter(Alert.is_active.is_(False))
            .delete(synchronize_session=False)
        )
        db.commit()
        log.info(
            "[Scheduler] Purged %d route queries, %d inactive alerts.",
            deleted_routes, deleted_alerts,
        )
    except Exception as exc:
        log.warning("[Scheduler] Purge failed: %s", exc)
        db.rollback()
    finally:
        db.close()


# ── Periodic runner ───────────────────────────────────────────────────────────

def _handle_signal(signum, frame):  # noqa: ANN001
    log.info("Scheduler received signal %s — shutting down.", signum)
    _shutdown.set()


async def _periodic(coro_fn, interval: int, name: str) -> None:
    while not _shutdown.is_set():
        try:
            await coro_fn()
        except Exception:
            log.exception("[Scheduler] '%s' raised an unhandled exception.", name)
        try:
            await asyncio.wait_for(_shutdown.wait(), timeout=interval)
        except asyncio.TimeoutError:
            pass


async def run() -> None:
    signal.signal(signal.SIGTERM, _handle_signal)
    signal.signal(signal.SIGINT, _handle_signal)

    log.info("Scheduler worker started.")

    await asyncio.gather(
        _periodic(run_predictions_for_all_stations, PREDICTION_INTERVAL, "predictions"),
        _periodic(evaluate_alert_thresholds,        ALERT_EVAL_INTERVAL,  "alerts"),
        _periodic(purge_stale_data,                 PURGE_INTERVAL,       "purge"),
    )

    log.info("Scheduler worker stopped.")


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        stream=sys.stdout,
    )
    asyncio.run(run())
