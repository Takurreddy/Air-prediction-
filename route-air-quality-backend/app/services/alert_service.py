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


# ── SMS ───────────────────────────────────────────────────────────────────────
import httpx

def _send_sms(to_phone: str, body: str) -> None:
    """Send an SMS via Twilio. Silent-fails if Twilio not configured."""
    if not settings.twilio_account_sid or not settings.twilio_from_number:
        log.debug("Twilio not configured — skipping SMS alert.")
        return

    try:
        if settings.twilio_api_key and settings.twilio_api_secret:
            auth = (settings.twilio_api_key, settings.twilio_api_secret)
        elif settings.twilio_auth_token:
            auth = (settings.twilio_account_sid, settings.twilio_auth_token)
        else:
            log.warning("Twilio auth not configured — skipping SMS alert.")
            return

        response = httpx.post(
            f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Messages.json",
            data={
                "From": settings.twilio_from_number,
                "To": to_phone,
                "Body": body,
            },
            auth=auth,
            timeout=10.0,
        )
        response.raise_for_status()
        log.info("SMS alert sent to %s", to_phone)
    except Exception as exc:
        log.warning("SMS alert failed: %s", exc)


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
    user_email: str | None,
    user_phone: str | None,
    station_id: str,
    aqi: float,
    category: str,
    notify_email: bool,
) -> None:
    """
    Fire all configured alert channels for a threshold breach.

    Args:
        db           — open SQLAlchemy session (for persisting the notification)
        user_id      — UUID of the user to notify
        user_email   — email address for SMTP channel
        user_phone   — phone number for SMS channel
        station_id   — station that breached the threshold
        aqi          — current predicted AQI value
        category     — AQI category string (e.g. "Unhealthy")
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

    # 2. Email
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

    # 3. SMS
    if user_phone:
        _send_sms(user_phone, body)
