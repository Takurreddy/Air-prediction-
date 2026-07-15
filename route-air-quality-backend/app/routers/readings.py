from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import influx as influx_db
from app.models.alert import Alert
from app.models.user import User
from app.database.postgres import get_db
from app.schemas.reading import AirQualityOut, ReadingOut, AlertCreate, AlertOut
from app.services.auth_service import get_current_user
from app.services.ml_interface import categorize_aqi
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("", response_model=list[AirQualityOut])
def get_air_quality(
    city: str = Query(..., description="City to query air quality for"),
    station_id: str | None = Query(None, description="Optionally filter by station"),
):
    """Latest air quality reading per station for a given city."""
    tables = influx_db.query_latest("air_quality", city=city, station_id=station_id)

    stations: dict[str, dict] = {}
    for table in tables:
        for record in table.records:
            sid = record.values.get("station_id", "unknown")
            entry = stations.setdefault(sid, {
                "station_id": sid,
                "city": record.values.get("city", city),
                "latitude": 0.0,
                "longitude": 0.0,
                "timestamp": record.get_time().isoformat(),
            })
            field = record.get_field()
            if field in ("pm25", "pm10", "no2", "temperature", "humidity", "aqi",
                         "latitude", "longitude"):
                entry[field] = record.get_value()

    if not stations:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No air quality data found for this city.",
        )

    result = []
    for entry in stations.values():
        aqi = entry.get("aqi")
        entry["category"] = categorize_aqi(float(aqi)) if aqi is not None else None
        result.append(AirQualityOut(**entry))
    return result


@router.get("/history", response_model=list[dict])
def get_history(
    city: str = Query(...),
    start: str = Query("-24h", description="Flux duration or RFC3339 timestamp"),
    station_id: str | None = Query(None),
):
    """Time-series readings for a city over a given window."""
    tables = influx_db.query_range("air_quality", city=city, start=start,
                                    station_id=station_id)
    result = []
    for table in tables:
        for record in table.records:
            result.append({
                "station_id": record.values.get("station_id"),
                "field":  record.get_field(),
                "value":  record.get_value(),
                "time":   record.get_time().isoformat(),
            })
    return result


@router.get("/history/predictions", response_model=list[dict])
def get_prediction_history(
    station_id: str = Query(...),
    start: str = Query("-7d"),
):
    """Retrieve stored LSTM predictions for a station from InfluxDB."""
    tables = influx_db.query_predictions(station_id=station_id, start=start)
    result = []
    for table in tables:
        for record in table.records:
            result.append({
                "time": record.get_time().isoformat(),
                **{k: v for k, v in record.values.items() if not k.startswith("_")},
            })
    return result


# ── Alerts ────────────────────────────────────────────────────────────────────

@router.post("/alerts", response_model=AlertOut, status_code=status.HTTP_201_CREATED)
def create_alert(
    payload: AlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register a threshold AQI alert for the authenticated user."""
    alert = Alert(
        user_id=current_user.id,
        station_id=payload.station_id,
        threshold_aqi=payload.threshold_aqi,
        notify_email=payload.notify_email,
        notify_push=payload.notify_push,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.get("/alerts", response_model=list[AlertOut])
def list_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all alerts belonging to the authenticated user."""
    return (
        db.query(Alert)
        .filter(Alert.user_id == current_user.id, Alert.is_active.is_(True))
        .all()
    )


@router.delete("/alerts/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deactivate (soft-delete) an alert."""
    alert = (
        db.query(Alert)
        .filter(Alert.id == alert_id, Alert.user_id == current_user.id)
        .first()
    )
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found.")
    alert.is_active = False
    db.commit()
