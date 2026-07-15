from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.postgres import Base


class RouteQuery(Base):
    """
    Persists every route evaluation request so users can review
    their history and the system can surface re-usable cached results.
    """
    __tablename__ = "route_queries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Optional — null for anonymous / unauthenticated requests
    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Origin and destination
    origin_lat: Mapped[float] = mapped_column(Float, nullable=False)
    origin_lon: Mapped[float] = mapped_column(Float, nullable=False)
    dest_lat: Mapped[float] = mapped_column(Float, nullable=False)
    dest_lon: Mapped[float] = mapped_column(Float, nullable=False)

    # Human-readable labels (from geocoding, optional)
    origin_label: Mapped[str | None] = mapped_column(String(512), nullable=True)
    dest_label: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Routing provider used (google | osrm | cached)
    provider: Mapped[str | None] = mapped_column(String(32), nullable=True)

    # Aggregate result for the recommended route
    recommended_route_index: Mapped[int | None] = mapped_column(
        Integer, nullable=True,
        comment="Index (0-based) of the lowest-AQI route among alternatives",
    )
    avg_aqi: Mapped[float | None] = mapped_column(Float, nullable=True)
    recommendation: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates=None, lazy="raise")
    waypoints: Mapped[list[RouteWaypoint]] = relationship(
        "RouteWaypoint", back_populates="route_query",
        cascade="all, delete-orphan",
        order_by="RouteWaypoint.sequence_index",
    )

    def __repr__(self) -> str:
        return (
            f"<RouteQuery id={self.id} "
            f"({self.origin_lat},{self.origin_lon}) → "
            f"({self.dest_lat},{self.dest_lon})>"
        )


class RouteWaypoint(Base):
    """
    One point along a route alternative with its AQI score.
    Multiple alternatives are stored under the same route_query_id,
    differentiated by `alternative_index`.
    """
    __tablename__ = "route_waypoints"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    route_query_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("route_queries.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )

    # Which route alternative this waypoint belongs to (0 = primary route)
    alternative_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # Position along that alternative
    sequence_index: Mapped[int] = mapped_column(Integer, nullable=False)

    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)

    # Nearest station used to derive AQI for this waypoint
    station_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    aqi: Mapped[float | None] = mapped_column(Float, nullable=True)
    category: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Whether AQI was predicted (LSTM) or taken from a live reading
    source: Mapped[str | None] = mapped_column(
        String(16), nullable=True,
        comment="live | predicted | interpolated",
    )

    route_query = relationship("RouteQuery", back_populates="waypoints")

    def __repr__(self) -> str:
        return (
            f"<RouteWaypoint route={self.route_query_id} "
            f"alt={self.alternative_index} seq={self.sequence_index} "
            f"aqi={self.aqi}>"
        )
