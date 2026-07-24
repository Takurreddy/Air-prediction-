"""
Alert dispatch service.

Handles:
  - Firebase Cloud Messaging (FCM) push notifications
  - Email alerts via SMTP (fallback)
  - Persisting Notification records to Postgres
"""
from __future__ import annotations

import logging
import smtplib
import uuid
from datetime import datetime, timezone
from email.mime.text import MIMEText

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.notification import Notification

log = logging.getLogger(__name__)

_firebase_app = None


def _get_firebase_app():
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app
    try:
        import firebase_admin
        from firebase_admin import credentials
        cred = credentials.Certificate(settings.firebase_credentials_path)
        _firebase_app = firebase_admin.initialize_app(cred)
        log.info("Firebase Admin SDK initialised.")
    except Exception as exc:
        log.warning("Firebase init failed: %s", exc)
    return _firebase_app


def send_push(fcm_token: str, title: str, body: str, data: dict | None = None) -> bool:
    """Send a Firebase push notification. Returns True on success."""
    try:
        _get_firebase_app()
        from firebase_admin import messaging
        msg = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in (data or {}).items()},
            token=fcm_token,
        )
        messaging.send(msg)
        log.info("FCM push sent to token ...%s", fcm_token[-6:])
        return True
    except Exception as exc:
        log.warning("FCM push failed: %s", exc)
        return False


def send_email(to_email: str, subject: str, body: str) -> bool:
    """Send an email alert. Returns True on success."""
    try:
        smtp_host = getattr(settings, "smtp_host", None)
        smtp_port = getattr(settings, "smtp_port", 587)
        smtp_user = getattr(settings, "smtp_user", None)
        smtp_pass = getattr(settings, "smtp_password", None)

        if not smtp_host or not smtp_user:
            log.info("SMTP not configured — skipping email to %s", to_email)
            return False

        msg = MIMEText(body, "plain")
        msg["Subject"] = subject
        msg["From"] = smtp_user
        msg["To"] = to_email

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, to_email, msg.as_string())

        log.info("Email alert sent to %s", to_email)
        return True
    except Exception as exc:
        log.warning("Email send failed: %s", exc)
        return False


def persist_notification(
    db: Session,
    user_id: uuid.UUID,
    notif_type: str,
    title: str,
    body: str,
    payload: dict | None = None,
) -> Notification:
    """Save a notification record to Postgres."""
    notif = Notification(
        user_id=user_id,
        type=notif_type,
        title=title,
        body=body,
        payload=payload,
        sent_at=datetime.now(timezone.utc),
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def dispatch_threshold_alert(
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
    """Dispatch a threshold breach alert via push and/or email, then persist it."""
    title = f"⚠️ Air Quality Alert — {category}"
    body = (
        f"AQI at station {station_id} has reached {aqi:.0f} ({category}). "
        "Consider limiting outdoor activity."
    )
    payload = {"station_id": station_id, "aqi": str(aqi), "category": category}

    if notify_push and fcm_token:
        send_push(fcm_token, title, body, payload)

    if notify_email and user_email:
        send_email(user_email, title, body)

    persist_notification(db, user_id, "threshold_breach", title, body, payload)
