"""
Alert dispatch service.

Called by the scheduler when a predicted AQI breaches a user's threshold.
Handles two channels:
  - Firebase Cloud Messaging (push) — via firebase-admin SDK
  - Email (SMTP) — via smtplib

Both channels are best-effort: a failure in one does NOT prevent the other,
and neither raises — they log and return.
"""
from __future__ import annotations

import logging
import smtplib
import uuid
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.notification import Notification

log = logging.getLogger(__name__)


# ── Firebase push ─────────────────────────────────────────────────────────────

def _send_push(fcm_token: str, title: str, body: str, data: dict) -> None:
    """Send a Firebase push notification. Silent-fails if SDK not configured."""
    try:
        import firebase_admin
        from firebase_admin import credentials, messaging

        if not firebase_admin._apps:
            cred_path = settings.firebase_credentials_path
            import os
            if not os.path.exists(cred_path):
                log.debug("Firebase credentials not found at %s — skipping push.", cred_path)
                return
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)

        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in data.items()},
            token=fcm_token,
        )
        response = messaging.send(message)
        log.info("Push sent: %s", response)

    except Exception as exc:
        log.warning("Push notification failed: %s", exc)


# ── Email ─────────────────────────────────────────────────────────────────────

def _send_email(to_email: str, subject: str, html_body: str) -> None:
    """Send an HTML email via SMTP. Silent-fails if SMTP not configured."""
    if not settings.smtp_host or not settings.smtp_user:
        log.debug("SMTP not configured — skipping email alert.")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = settings.smtp_user
        msg["To"]      = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_user, to_email, msg.as_string())

        log.info("Email alert sent to %s", to_email)

    except Exception as exc:
        log.warning("Email alert failed: %s", exc)


# ── Notification record ───────────────────────────────────────────────────────

def _persist_notification(
    db: Session,
    user_id: uuid.UUID,
    title: str,
    body: str,
    payload: dict,
) -> None:
    """Write a Notification row to Postgres so the user sees it in-app."""
    try:
        n = Notification(
            user_id=user_id,
            type="threshold_breach",
            title=title,
            body=body,
            payload=payload,
            sent_at=datetime.now(timezone.utc),
        )
        db.add(n)
        db.commit()
    except Exception as exc:
        log.warning("Failed to persist notification: %s", exc)
        db.rollback()


# ── Public entry point ────────────────────────────────────────────────────────

def dispatch_threshold_alert(
    *,
    db: Session,
    user_id: uuid.UUID,
    user_email: str,
    fcm_token: str | None,
    station_id: str,
    aqi: float,
    category: str,
    notify_push: bool,
    notify_email: bool,
) -> None:
    """
    Fire all configured alert channels for a threshold breach.

    Args:
        db           — open SQLAlchemy session (for persisting the notification)
        user_id      — UUID of the user to notify
        user_email   — email address for SMTP channel
        fcm_token    — Firebase device token (None = skip push)
        station_id   — station that breached the threshold
        aqi          — current predicted AQI value
        category     — AQI category string (e.g. "Unhealthy")
        notify_push  — whether the user wants push notifications
        notify_email — whether the user wants email notifications
    """
    title   = f"Air Quality Alert — {category}"
    body    = (
        f"AQI at station {station_id} has reached {aqi:.0f} ({category}). "
        "Consider limiting outdoor activities."
    )
    payload = {
        "station_id": station_id,
        "aqi":        aqi,
        "category":   category,
        "type":       "threshold_breach",
    }

    # 1. Persist in-app notification (always)
    _persist_notification(db, user_id, title, body, payload)

    # 2. Push notification
    if notify_push and fcm_token:
        _send_push(fcm_token, title, body, payload)

    # 3. Email
    if notify_email and user_email:
        html = f"""
        <html><body style="font-family:sans-serif;padding:24px;">
          <h2 style="color:#d32f2f;">⚠ Air Quality Alert</h2>
          <p>The predicted AQI at station <strong>{station_id}</strong>
             has reached <strong>{aqi:.0f}</strong>
             (<span style="color:#d32f2f;">{category}</span>).</p>
          <p>Consider staying indoors or wearing a mask if you must go out.</p>
          <hr/>
          <small>AirAware India — Route Air Quality Prediction</small>
        </body></html>
        """
        _send_email(user_email, title, html)
