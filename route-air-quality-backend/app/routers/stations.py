from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.postgres import get_db
from app.models.station import Station
from app.schemas.station import StationOut, StationCreate

router = APIRouter()


DEFAULT_INITIAL_STATIONS = [
    {"station_id": "cpcb-delhi-ito",            "city": "Delhi",         "latitude": 28.6289, "longitude": 77.2410, "name": "CPCB ITO Station", "source_api": "cpcb"},
    {"station_id": "cpcb-delhi-rkpuram",        "city": "Delhi",         "latitude": 28.5632, "longitude": 77.1869, "name": "R.K. Puram Station", "source_api": "cpcb"},
    {"station_id": "cpcb-mumbai-bandra",        "city": "Mumbai",        "latitude": 19.0596, "longitude": 72.8295, "name": "Bandra East Station", "source_api": "cpcb"},
    {"station_id": "cpcb-mumbai-worli",         "city": "Mumbai",        "latitude": 19.0176, "longitude": 72.8172, "name": "Worli Station", "source_api": "cpcb"},
    {"station_id": "cpcb-bangalore-peenya",     "city": "Bengaluru",     "latitude": 13.0285, "longitude": 77.5197, "name": "Peenya Station", "source_api": "cpcb"},
    {"station_id": "cpcb-bangalore-bapuji",     "city": "Bengaluru",     "latitude": 12.9580, "longitude": 77.5380, "name": "Bapuji Nagar Station", "source_api": "cpcb"},
    {"station_id": "cpcb-hyderabad-sanath",     "city": "Hyderabad",     "latitude": 17.4568, "longitude": 78.4439, "name": "Sanathnagar Station", "source_api": "cpcb"},
    {"station_id": "cpcb-chennai-alandur",      "city": "Chennai",       "latitude": 13.0012, "longitude": 80.2015, "name": "Alandur Station", "source_api": "cpcb"},
    {"station_id": "cpcb-kolkata-victoria",     "city": "Kolkata",       "latitude": 22.5448, "longitude": 88.3426, "name": "Victoria Memorial Station", "source_api": "cpcb"},
    {"station_id": "cpcb-ahmedabad-maninagar",  "city": "Ahmedabad",     "latitude": 23.0010, "longitude": 72.6010, "name": "Maninagar Station", "source_api": "cpcb"},
    {"station_id": "cpcb-pune-karvenagar",      "city": "Pune",          "latitude": 18.4900, "longitude": 73.8200, "name": "Karve Nagar Station", "source_api": "cpcb"},
    {"station_id": "cpcb-jaipur-mansarovar",    "city": "Jaipur",        "latitude": 26.8600, "longitude": 75.7600, "name": "Mansarovar Station", "source_api": "cpcb"},
    {"station_id": "cpcb-lucknow-talkatora",    "city": "Lucknow",       "latitude": 26.8300, "longitude": 80.9000, "name": "Talkatora Station", "source_api": "cpcb"},
    {"station_id": "cpcb-surat-limbayat",       "city": "Surat",         "latitude": 21.1800, "longitude": 72.8500, "name": "Limbayat Station", "source_api": "cpcb"},
    {"station_id": "cpcb-visakhapatnam-gaju",   "city": "Visakhapatnam", "latitude": 17.6900, "longitude": 83.2000, "name": "Gajuwaka Station", "source_api": "cpcb"},
]


def _ensure_seeded(db: Session):
    count = db.query(Station).count()
    if count == 0:
        for info in DEFAULT_INITIAL_STATIONS:
            db.add(Station(**info, is_active=True))
        db.commit()


@router.get("", response_model=list[StationOut])
def list_stations(
    city: str | None = Query(None, description="Filter by city name"),
    active_only: bool = Query(True, description="Return only active stations"),
    db: Session = Depends(get_db),
):
    """List all monitoring stations, optionally filtered by city."""
    _ensure_seeded(db)
    q = db.query(Station)
    if city:
        q = q.filter(Station.city.ilike(f"%{city.strip()}%"))
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
