"""
Scheduled-task worker.

Responsibilities
────────────────
  1. Trigger proactive LSTM predictions for all active stations on a
     regular schedule so route evaluations can serve cached results quickly.
  2. Evaluate user-defined AQI threshold alerts and dispatch notifications
     (email / Firebase push) when thresholds are breached.
  3. Purge expired / soft-deleted rows from Postgres to keep the DB lean.

Current status: scaffold with clearly marked TODO sections.
Run as:  python -m app.workers.scheduler
"""
from __future__ import annotations

import asyncio
import logging
import signal
import sys

log = logging.getLogger(__name__)


# ── Scheduled tasks ───────────────────────────────────────────────────────────

async def run_predictions_for_all_stations() -> None:
    """
    For each active station, fetch the last 24 h of readings from InfluxDB,
    build the feature sequence, call predict_aqi(), and store the result.

    TODO:
      - Query all active Station rows from Postgres.
      - For each station, call influx_db.query_range() for the lookback window.
      - Reshape the result into a list[dict] matching FEATURE_ORDER.
      - Call ml_interface.predict_aqi() and persist via influx_db.write_prediction().
    """
    log.info("[Scheduler] Proactive prediction pass — not yet implemented")


async def evaluate_alert_thresholds() -> None:
    """
    Load all active alerts from Postgres, compare against the latest predicted
    AQI for the associated station, and dispatch notifications if breached.

    TODO:
      - Query Alert rows where is_active=True from Postgres.
      - Look up the most-recent predicted_aqi for each station from InfluxDB.
      - If predicted_aqi >= threshold_aqi and last_triggered_at is None or
        was more than X hours ago, fire the notification.
      - Update Alert.last_triggered_at in Postgres.
      - Dispatch via Firebase Admin SDK (push) or SMTP (email).
    """
    log.info("[Scheduler] Alert evaluation — not yet implemented")


async def purge_stale_data() -> None:
    """
    Remove soft-deleted / expired rows to keep database size manageable.

    TODO:
      - Delete RouteQuery rows older than a configurable retention window.
      - Delete deactivated Alert rows older than N days.
    """
    log.info("[Scheduler] Stale-data purge — not yet implemented")


# ── Cron-style timing ─────────────────────────────────────────────────────────

# How often (seconds) each task fires
PREDICTION_INTERVAL   = 3_600   # 1 hour
ALERT_EVAL_INTERVAL   = 600     # 10 minutes
PURGE_INTERVAL        = 86_400  # 24 hours

_shutdown = asyncio.Event()


def _handle_signal(signum, frame):  # noqa: ANN001
    log.info("Scheduler received signal %s — shutting down.", signum)
    _shutdown.set()


async def _periodic(coro_fn, interval: int, name: str) -> None:
    """Run `coro_fn` every `interval` seconds until shutdown is requested."""
    while not _shutdown.is_set():
        try:
            await coro_fn()
        except Exception:
            log.exception("[Scheduler] '%s' task raised an unhandled exception.", name)

        try:
            await asyncio.wait_for(_shutdown.wait(), timeout=interval)
        except asyncio.TimeoutError:
            pass  # normal — schedule next run


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
