from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.postgres import Base


class Notification(Base):
    """
    Every alert dispatched to a user via FCM / APNs.

    payload allows the mobile app to deep-link:
        tap notification → open that route or that map location directly.

    type values: "threshold_breach" | "route_advisory" | "daily_summary"
    """
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    type: Mapped[str] = mapped_column(
        String(64), nullable=False, index=True,
        comment="threshold_breach | route_advisory | daily_summary",
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)

    # Deep-link data — e.g. {"aqi": 156, "location": {...}, "route_id": "uuid"}
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)

    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", lazy="raise")

    def __repr__(self) -> str:
        return (
            f"<Notification id={self.id} type={self.type!r} "
            f"user={self.user_id} read={self.read}>"
        )
