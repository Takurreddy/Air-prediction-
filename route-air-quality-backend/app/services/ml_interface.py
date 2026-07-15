"""
ML pipeline: scale time features → LSTM predict → return pollutant values + AQI.

Model architecture (from training notebook):
  Input  : (batch, 24, 15)  — 24-hour lookback window, 15 features
  Output : (batch, 4)       — PM2.5, PM10, NO2, SO2  (µg/m³, original scale)

Feature order (must match training exactly):
  ['PM2.5', 'PM10', 'NO', 'NO2', 'NOX', 'NH3', 'SO2',
   'RH', 'WD', 'AT', 'WS', 'Hour', 'DayOfWeek', 'Month', 'WD ']

The scaler (time_scaler.pkl) was fitted only on ['Hour', 'DayOfWeek', 'Month'].
All other features are passed through in raw physical units.
"""
from __future__ import annotations

import logging
import os

import numpy as np

from app.core.config import settings

log = logging.getLogger(__name__)

# ── Feature / output metadata ─────────────────────────────────────────────────

FEATURE_ORDER: list[str] = [
    "PM2.5", "PM10", "NO", "NO2", "NOX", "NH3", "SO2",
    "RH", "WD", "AT", "WS", "Hour", "DayOfWeek", "Month", "WD ",
]
TIME_FEATURE_INDICES = [FEATURE_ORDER.index(c) for c in ("Hour", "DayOfWeek", "Month")]
TARGET_COLS = ["PM2.5", "PM10", "NO2", "SO2"]
SEQ_LENGTH = 24

# US EPA AQI breakpoints
_AQI_CATEGORIES: list[tuple[float, str]] = [
    (50,  "Good"),
    (100, "Moderate"),
    (150, "Unhealthy for Sensitive Groups"),
    (200, "Unhealthy"),
    (300, "Very Unhealthy"),
    (500, "Hazardous"),
]


# ── AQI helpers ───────────────────────────────────────────────────────────────

def categorize_aqi(aqi: float) -> str:
    for threshold, label in _AQI_CATEGORIES:
        if aqi <= threshold:
            return label
    return "Hazardous"


def _pm25_to_aqi(pm25: float) -> float:
    """Convert PM2.5 concentration (µg/m³) to US EPA AQI score."""
    breakpoints = [
        (0.0,    12.0,   0,   50),
        (12.1,   35.4,  51,  100),
        (35.5,   55.4, 101,  150),
        (55.5,  150.4, 151,  200),
        (150.5, 250.4, 201,  300),
        (250.5, 350.4, 301,  400),
        (350.5, 500.4, 401,  500),
    ]
    for c_lo, c_hi, i_lo, i_hi in breakpoints:
        if c_lo <= pm25 <= c_hi:
            return round(((i_hi - i_lo) / (c_hi - c_lo)) * (pm25 - c_lo) + i_lo, 2)
    return 500.0  # beyond scale


# ── Lazy singleton loaders ────────────────────────────────────────────────────

_model = None
_scaler = None


def _load_artifacts() -> None:
    global _model, _scaler
    if _model is not None:
        return  # already loaded

    model_path = settings.ml_model_path
    scaler_path = settings.ml_scaler_path

    if os.path.exists(model_path) and os.path.exists(scaler_path):
        try:
            import joblib
            from tensorflow.keras.models import load_model  # type: ignore[import]

            _model = load_model(model_path)
            _scaler = joblib.load(scaler_path)
            log.info("ML artifacts loaded: %s, %s", model_path, scaler_path)
        except Exception as exc:
            log.warning("Failed to load ML artifacts (%s) — using stub predictor", exc)
    else:
        log.info(
            "ML artifacts not found at '%s' / '%s' — using stub predictor",
            model_path,
            scaler_path,
        )


# ── Public interface ──────────────────────────────────────────────────────────

def predict_aqi(station_id: str, sequence: list[dict]) -> dict:
    """
    Run the LSTM model on a 24-hour lookback window.

    Args:
        station_id: Identifier of the target station (passed through to output).
        sequence:   List of exactly 24 dicts, each containing keys from
                    FEATURE_ORDER.  Missing / None values are treated as 0.

    Returns:
        {
          "station_id"    : str,
          "pm25"          : float,
          "pm10"          : float,
          "no2"           : float,
          "so2"           : float,
          "predicted_aqi" : float,   # derived from PM2.5 via US EPA formula
          "category"      : str,
          "model_version" : str,
        }
    """
    _load_artifacts()

    if len(sequence) != SEQ_LENGTH:
        raise ValueError(
            f"sequence must contain exactly {SEQ_LENGTH} timesteps, got {len(sequence)}"
        )

    # Build (24, 15) float32 array — clamp to ≥ 0 to avoid negative concentrations
    X = np.array(
        [[max(float(step.get(f) or 0.0), 0.0) for f in FEATURE_ORDER]
         for step in sequence],
        dtype=np.float32,
    )  # shape: (24, 15)

    if _model is not None and _scaler is not None:
        # Scale only the three cyclic time columns in-place
        X[:, TIME_FEATURE_INDICES] = _scaler.transform(X[:, TIME_FEATURE_INDICES])

        # LSTM expects (batch, timesteps, features)
        X_batch = X.reshape(1, SEQ_LENGTH, len(FEATURE_ORDER))
        preds = _model.predict(X_batch, verbose=0)[0]   # shape: (4,)
        pm25, pm10, no2, so2 = (float(v) for v in preds)
        version = "lstm-v1"
    else:
        # Stub: echo the last timestep's values (used when artifacts aren't mounted)
        last = sequence[-1]
        pm25 = max(float(last.get("PM2.5") or 0.0), 0.0)
        pm10 = max(float(last.get("PM10")  or 0.0), 0.0)
        no2  = max(float(last.get("NO2")   or 0.0), 0.0)
        so2  = max(float(last.get("SO2")   or 0.0), 0.0)
        version = "stub-v0"

    predicted_aqi = _pm25_to_aqi(pm25)

    return {
        "station_id":     station_id,
        "pm25":           round(pm25, 4),
        "pm10":           round(pm10, 4),
        "no2":            round(no2,  4),
        "so2":            round(so2,  4),
        "predicted_aqi":  predicted_aqi,
        "category":       categorize_aqi(predicted_aqi),
        "model_version":  version,
    }
