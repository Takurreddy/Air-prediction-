from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.postgres import get_db
from app.models.station import Station
from app.schemas.station import StationOut, StationCreate

router = APIRouter()


@router.get("", response_model=list[StationOut])
def list_stations(
    city: str | None = Query(None, description="Filter by city name"),
    active_only: bool = Query(True, description="Return only active stations"),
    db: Session = Depends(get_db),
):
    """List all monitoring stations, optionally filtered by city."""
    q = db.query(Station)
    if city:
        q = q.filter(Station.city.ilike(f"%{city}%"))
    if active_only:
        q = q.filter(Station.is_active.is_(True))
    return q.order_by(Station.city, Station.station_id).all()


@router.get("/{station_id}", response_model=StationOut)
def get_station(station_id: str, db: Session = Depends(get_db)):
    """Retrieve a single station by its external identifier."""
    station = db.query(Station).filter(Station.station_id == station_id).first()
    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Station '{station_id}' not found.",
        )
    return station


@router.post("", response_model=StationOut, status_code=status.HTTP_201_CREATED)
def create_station(payload: StationCreate, db: Session = Depends(get_db)):
    """
    Register a new monitoring station.
    Typically called by the data-ingestion worker, not directly by users.
    """
    if db.query(Station).filter(Station.station_id == payload.station_id).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Station '{payload.station_id}' already exists.",
        )
    station = Station(**payload.model_dump())
    db.add(station)
    db.commit()
    db.refresh(station)
    return station
