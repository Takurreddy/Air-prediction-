import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.postgres import get_db
from app.models.prediction_history import PredictionHistory
from app.models.user import User
from app.schemas.prediction_history import PredictionHistoryCreate, PredictionHistoryOut
from app.services.auth_service import get_current_user, get_optional_user

router = APIRouter()


@router.get("", response_model=list[PredictionHistoryOut])
def list_prediction_history(
    lat: float | None = Query(None, description="Filter by latitude (exact)"),
    lon: float | None = Query(None, description="Filter by longitude (exact)"),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return stored LSTM predictions for the current user.
    Optionally filter by lat/lon to narrow to a specific location.
    """
    q = (
        db.query(PredictionHistory)
        .filter(PredictionHistory.user_id == current_user.id)
    )
    if lat is not None:
        q = q.filter(PredictionHistory.latitude == lat)
    if lon is not None:
        q = q.filter(PredictionHistory.longitude == lon)

    return (
        q.order_by(PredictionHistory.prediction_time.desc())
        .limit(limit)
        .all()
    )


@router.get("/{prediction_id}", response_model=PredictionHistoryOut)
def get_prediction(
    prediction_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve a single prediction record by ID."""
    pred = (
        db.query(PredictionHistory)
        .filter(
            PredictionHistory.id == prediction_id,
            PredictionHistory.user_id == current_user.id,
        )
        .first()
    )
    if not pred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction record not found.",
        )
    return pred


@router.post("", response_model=PredictionHistoryOut, status_code=status.HTTP_201_CREATED)
def store_prediction(
    payload: PredictionHistoryCreate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    """
    Persist an LSTM prediction result to Postgres.
    Called internally by the prediction engine after each /predict run.
    User is optional — anonymous predictions are allowed.
    """
    pred = PredictionHistory(
        user_id=current_user.id if current_user else None,
        latitude=payload.latitude,
        longitude=payload.longitude,
        predicted_aqi=payload.predicted_aqi,
        pollutant_breakdown=payload.pollutant_breakdown,
        weather_context=payload.weather_context,
        valid_from=payload.valid_from,
        valid_to=payload.valid_to,
        model_version=payload.model_version,
        confidence_score=payload.confidence_score,
    )
    db.add(pred)
    db.commit()
    db.refresh(pred)
    return pred
