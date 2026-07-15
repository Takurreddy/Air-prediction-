from __future__ import annotations

from pydantic import BaseModel, Field


# ── LSTM input ────────────────────────────────────────────────────────────────

class TimeStep(BaseModel):
    """
    One hour of sensor + meteorological readings — matches the 15 training
    features exactly.  Field aliases map to the original column names used
    during model training.
    """
    # Pollutants
    pm25: float | None = Field(None, alias="PM2.5")
    pm10: float | None = Field(None, alias="PM10")
    no:   float | None = Field(None, alias="NO")
    no2:  float | None = Field(None, alias="NO2")
    nox:  float | None = Field(None, alias="NOX")
    nh3:  float | None = Field(None, alias="NH3")
    so2:  float | None = Field(None, alias="SO2")
    # Meteorology
    rh:   float | None = Field(None, alias="RH")    # relative humidity  (%)
    wd:   float | None = Field(None, alias="WD")    # wind direction     (°)
    at:   float | None = Field(None, alias="AT")    # ambient temperature (°C)
    ws:   float | None = Field(None, alias="WS")    # wind speed         (m/s)
    wd2:  float | None = Field(None, alias="WD ")   # secondary wind-direction col
    # Cyclical time features (will be scaled by time_scaler inside ml_interface)
    hour:        int | None = Field(None, alias="Hour")
    day_of_week: int | None = Field(None, alias="DayOfWeek")
    month:       int | None = Field(None, alias="Month")

    model_config = {"populate_by_name": True}


class PredictRequest(BaseModel):
    station_id: str
    latitude:   float
    longitude:  float
    # 24-hour lookback window, oldest timestep first
    sequence: list[TimeStep] = Field(
        ...,
        min_length=24,
        max_length=24,
        description="Exactly 24 hourly timesteps (oldest → newest).",
    )


# ── LSTM output ───────────────────────────────────────────────────────────────

class PredictionOut(BaseModel):
    station_id:    str
    predicted_for: str          # ISO-8601 UTC timestamp
    # Predicted pollutant concentrations (µg/m³)
    pm25:  float
    pm10:  float
    no2:   float
    so2:   float
    # Derived AQI (US EPA formula based on PM2.5)
    predicted_aqi: float
    category:      str
    model_version: str
