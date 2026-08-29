from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.postgres import Base


class User(Base):
    """
    Application user.

    health_profile   — medical facts (asthma, age_group, custom AQI thresholds)
                       drives *what* AQI level is dangerous for this user.
    notification_prefs — behavioural choices (push/email, quiet hours, threshold)
                         drives *how and when* we notify them.
    """
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    email: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True, index=True
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    phone_number: Mapped[str | None] = mapped_column(
        String(20), unique=True, nullable=True, index=True
    )
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # JSON fields — stored as JSONB on Postgres for indexed querying
    # Example: {"sensitivity": "asthmatic", "age_group": "adult",
    #           "custom_thresholds": {"pm25": 25}}
    health_profile: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Example: {"push_enabled": true, "threshold_aqi": 100,
    #           "quiet_hours": {"start": "22:00", "end": "07:00"}}
    notification_prefs: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r}>"
