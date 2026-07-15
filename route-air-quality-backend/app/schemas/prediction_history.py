from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class PredictionHistoryCreate(BaseModel):
    """Written by the prediction engine after every LSTM inference."""
    latitude: float
    longitude: float

    # Headline result
    # {"aqi": 87, "category": "Moderate", "dominant_pollutant": "PM2.5", "confidence": 0.82}
    predicted_aqi: dict

    # Raw pollutant concentrations (µg/m³)
    # {"PM2.5": 22.4, "PM10": 41.2, "NO2": 18.7, "O3": 54.1, "CO": 0.6}
    pollutant_breakdown: dict | None = None

    # Meteorological snapshot at inference time
    # {"temp": 28, "humidity": 65, "wind_speed": 3.2}
    weather_context: dict | None = None

    # Forecast window — distinct from the time the model was run
    valid_from: datetime | None = None
    valid_to: datetime | None = None

    model_version: str | None = None
    confidence_score: float | None = Field(None, ge=0.0, le=1.0)


class PredictionHistoryOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID | None = None
    latitude: float
    longitude: float
    predicted_aqi: dict
    pollutant_breakdown: dict | None = None
    weather_context: dict | None = None
    prediction_time: datetime
    valid_from: datetime | None = None
    valid_to: datetime | None = None
    model_version: str | None = None
    confidence_score: float | None = None

    model_config = {"from_attributes": True}
