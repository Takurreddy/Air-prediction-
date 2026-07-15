from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.postgres import Base


class FavoriteRoute(Base):
    """
    A saved commute or frequently-used route for a user.

    aqi_exposure_profile is computed once when the route is saved, then
    refreshed nightly by the scheduler.  The dashboard reads it instantly —
    no real-time calculation needed per request.

    Fields:
        origin / destination  — JSON with lat, lng, address
        waypoints             — JSON array of intermediate stops
        route_geometry        — GeoJSON LineString polyline for the map
        aqi_exposure_profile  — pre-computed per-segment AQI breakdown
    """
    __tablename__ = "favorite_routes"

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
        String(255), nullable=False,
        comment='User-assigned label, e.g. "Home → Office"',
    )

    # Example: {"lat": 12.97, "lng": 77.59, "address": "Koramangala"}
    origin: Mapped[dict] = mapped_column(JSON, nullable=False)
    destination: Mapped[dict] = mapped_column(JSON, nullable=False)

    # Example: [{"lat": 12.95, "lng": 77.60, "address": "School drop"}]
    waypoints: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # GeoJSON LineString — {"type": "LineString", "coordinates": [[lng, lat], ...]}
    route_geometry: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Pre-computed per-segment exposure
    # Example: [{"segment": 0, "distance_km": 2.1, "avg_aqi": 94, "duration_min": 8}]
    aqi_exposure_profile: Mapped[list | None] = mapped_column(JSON, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

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

    user = relationship("User", lazy="raise")

    def __repr__(self) -> str:
        return f"<FavoriteRoute id={self.id} name={self.name!r} user={self.user_id}>"
