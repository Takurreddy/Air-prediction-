from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.postgres import Base


class Station(Base):
    """
    A physical (or virtual) air-quality monitoring station.
    Stations are the anchor points for both raw sensor readings and
    LSTM predictions stored in InfluxDB.
    """
    __tablename__ = "stations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    station_id: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False, index=True,
        comment="Stable external identifier (e.g. OpenAQ location ID or WAQI UID)",
    )
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    country: Mapped[str | None] = mapped_column(String(64), nullable=True)

    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)

    # Data source this station is ingested from
    source_api: Mapped[str | None] = mapped_column(
        String(64), nullable=True,
        comment="openaq | waqi | manual",
    )
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    def __repr__(self) -> str:
        return (
            f"<Station station_id={self.station_id!r} "
            f"city={self.city!r} lat={self.latitude} lon={self.longitude}>"
        )
