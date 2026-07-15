from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status

from app.schemas.prediction import PredictRequest, PredictionOut, TimeStep
from app.services.ml_interface import FEATURE_ORDER, predict_aqi
from app.database.influx import write_prediction
import logging

log = logging.getLogger(__name__)
router = APIRouter()


def _step_to_dict(step: TimeStep) -> dict:
    """Map a TimeStep Pydantic model to the flat feature dict expected by ml_interface."""
    alias_map = {
        "PM2.5":    step.pm25,
        "PM10":     step.pm10,
        "NO":       step.no,
        "NO2":      step.no2,
        "NOX":      step.nox,
        "NH3":      step.nh3,
        "SO2":      step.so2,
        "RH":       step.rh,
        "WD":       step.wd,
        "AT":       step.at,
        "WS":       step.ws,
        "WD ":      step.wd2,
        "Hour":     step.hour,
        "DayOfWeek": step.day_of_week,
        "Month":    step.month,
    }
    # Replace None with 0.0 so numpy doesn't trip on missing values
    return {k: (float(v) if v is not None else 0.0) for k, v in alias_map.items()}


@router.post("", response_model=PredictionOut, status_code=status.HTTP_200_OK)
def predict(payload: PredictRequest):
    """
    Run the LSTM model on a 24-hour lookback sequence for a station and
    return predicted pollutant concentrations + derived AQI.
    """
    sequence = [_step_to_dict(s) for s in payload.sequence]

    try:
        result = predict_aqi(payload.station_id, sequence)
    except Exception as exc:
        log.exception("Prediction failed for station %s", payload.station_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {exc}",
        ) from exc

    # Persist result to InfluxDB — best-effort, never fails the request
    try:
        write_prediction(
            station_id=payload.station_id,
            latitude=payload.latitude,
            longitude=payload.longitude,
            inputs={k: sequence[-1].get(k) for k in FEATURE_ORDER},
            predicted_aqi=result["predicted_aqi"],
            category=result["category"],
            model_version=result["model_version"],
        )
    except Exception:
        log.warning("Failed to persist prediction for station %s", payload.station_id)

    return PredictionOut(
        station_id=result["station_id"],
        predicted_for=datetime.now(timezone.utc).isoformat(),
        pm25=result["pm25"],
        pm10=result["pm10"],
        no2=result["no2"],
        so2=result["so2"],
        predicted_aqi=result["predicted_aqi"],
        category=result["category"],
        model_version=result["model_version"],
    )
