from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.postgres import Base


class PredictionHistory(Base):
    """
    Every AQI forecast the LSTM model has ever produced.

    valid_from / valid_to define the *forecast window* (e.g. "11 AM – 12 PM"),
    which is distinct from prediction_time ("when we ran the model at 10 AM").
    This lets clients query: "What did we predict for this location at 11 AM yesterday?"
    """
    __tablename__ = "prediction_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)

    # Headline result
    # Example: {"aqi": 87, "category": "Moderate",
    #           "dominant_pollutant": "PM2.5", "confidence": 0.82}
    predicted_aqi: Mapped[dict] = mapped_column(JSON, nullable=False)

    # Raw pollutant concentrations (µg/m³)
    # Example: {"PM2.5": 22.4, "PM10": 41.2, "NO2": 18.7, "O3": 54.1, "CO": 0.6}
    pollutant_breakdown: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Meteorological context at forecast time
    # Example: {"temp": 28, "humidity": 65, "wind_speed": 3.2}
    weather_context: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # When the model was run
    prediction_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    # Forecast window
    valid_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    valid_to: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    model_version: Mapped[str | None] = mapped_column(String(64), nullable=True)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    user = relationship("User", lazy="raise")

    def __repr__(self) -> str:
        return (
            f"<PredictionHistory id={self.id} "
            f"lat={self.latitude} lon={self.longitude} "
            f"at={self.prediction_time}>"
        )
