from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, String, text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.postgres import Base


class SavedLocation(Base):
    """
    Named places a user has bookmarked (Home, Work, Gym, Kid's School …).

    Partial unique indexes enforce the one-home / one-work rule at the DB level:
        uq_saved_locations_user_home  — only one row per user may have is_home = TRUE
        uq_saved_locations_user_work  — only one row per user may have is_work = TRUE

    location_metadata holds extra context from Google Places API:
        {"place_id": "ChIJ...", "timezone": "Asia/Kolkata", "elevation": 920}
    """
    __tablename__ = "saved_locations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(128), nullable=False,
        comment="User label, e.g. 'Home', 'Gym', 'Kid\\'s School'",
    )
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    address: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Extra data from Google Places / geocoding
    location_metadata: Mapped[dict | None] = mapped_column(
        JSON, nullable=True,
        comment='{"place_id": "ChIJ...", "timezone": "Asia/Kolkata"}',
    )

    is_home: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_work: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User", lazy="raise")

    # ── Partial unique indexes (one home + one work per user, unlimited others) ─
    __table_args__ = (
        Index(
            "uq_saved_locations_user_home",
            "user_id",
            unique=True,
            postgresql_where=text("is_home = TRUE"),
        ),
        Index(
            "uq_saved_locations_user_work",
            "user_id",
            unique=True,
            postgresql_where=text("is_work = TRUE"),
        ),
    )

    def __repr__(self) -> str:
        flags = []
        if self.is_home:
            flags.append("HOME")
        if self.is_work:
            flags.append("WORK")
        tag = f" [{','.join(flags)}]" if flags else ""
        return f"<SavedLocation id={self.id} name={self.name!r}{tag}>"
