"""
Geocoding API — city/station lookup by name, reverse geocoding, nearest station.

Endpoints
─────────
GET /api/geocoding/search          Search city by name (supports regional aliases)
GET /api/geocoding/reverse         Lat/lng → nearest monitored city
GET /api/geocoding/nearest-station Lat/lng → nearest monitoring station
"""
from __future__ import annotations

import math
import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.postgres import get_db
from app.models.station import Station

log = logging.getLogger(__name__)

router = APIRouter()

# Regional city name aliases for multi-language search
CITY_ALIASES: dict[str, str] = {
    # Hindi
    "दिल्ली": "Delhi", "मुंबई": "Mumbai", "बेंगलुरु": "Bengaluru",
    "चेन्नई": "Chennai", "कोलकाता": "Kolkata", "हैदराबाद": "Hyderabad",
    "अहमदाबाद": "Ahmedabad", "पुणे": "Pune", "जयपुर": "Jaipur",
    "लखनऊ": "Lucknow", "सूरत": "Surat", "कानपुर": "Kanpur",
    "नागपुर": "Nagpur", "इंदौर": "Indore", "भोपाल": "Bhopal",
    "पटना": "Patna", "वाराणसी": "Varanasi", "गुवाहाटी": "Guwahati",
    # Tamil
    "சென்னை": "Chennai", "கோயம்புத்தூர்": "Coimbatore",
    # Telugu
    "విశాఖపట్నం": "Visakhapatnam", "హైదరాబాద్": "Hyderabad",
    "విజయవాడ": "Vijayawada",
    # Kannada
    "ಬೆಂಗಳೂರು": "Bengaluru", "ಮೈಸೂರು": "Mysuru",
    # Common alternate English names
    "bombay": "Mumbai", "bangalore": "Bengaluru", "madras": "Chennai",
    "calcutta": "Kolkata", "benares": "Varanasi", "trivandrum": "Thiruvananthapuram",
    "cochin": "Kochi", "mysore": "Mysuru", "pondicherry": "Puducherry",
    "vizag": "Visakhapatnam", "guwahati": "Guwahati",
}


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in kilometres."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@router.get("/search")
def search_city(
    q: str = Query(..., min_length=1, description="Search query (city name)"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """
    Search for cities by name. Supports regional aliases in Hindi, Tamil,
    Telugu, and Kannada, as well as common alternate English spellings.
    """
    query_lower = q.strip().lower()

    # Check aliases first
    canonical = CITY_ALIASES.get(q.strip()) or CITY_ALIASES.get(query_lower)

    if canonical:
        stations = (
            db.query(Station)
            .filter(Station.city.ilike(f"%{canonical}%"), Station.is_active.is_(True))
            .all()
        )
        cities_set = list({s.city for s in stations})
        return {
            "query": q,
            "resolved_alias": canonical,
            "cities": cities_set[:limit],
            "stations": [
                {"station_id": s.station_id, "city": s.city,
                 "latitude": s.latitude, "longitude": s.longitude}
                for s in stations[:limit]
            ],
        }

    # Direct search on city column
    stations = (
        db.query(Station)
        .filter(Station.city.ilike(f"%{q.strip()}%"), Station.is_active.is_(True))
        .order_by(Station.city)
        .limit(limit)
        .all()
    )

    cities_set = list({s.city for s in stations})
    return {
        "query": q,
        "resolved_alias": None,
        "cities": cities_set,
        "stations": [
            {"station_id": s.station_id, "city": s.city,
             "latitude": s.latitude, "longitude": s.longitude}
            for s in stations
        ],
    }


@router.get("/reverse")
def reverse_geocode(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lng: float = Query(..., ge=-180, le=180, description="Longitude"),
    db: Session = Depends(get_db),
):
    """Reverse geocode: lat/lng → nearest monitored city."""
    stations = db.query(Station).filter(Station.is_active.is_(True)).all()
    if not stations:
        return {"nearest_city": None, "distance_km": None}

    best = None
    best_dist = float("inf")
    for s in stations:
        d = _haversine_km(lat, lng, s.latitude, s.longitude)
        if d < best_dist:
            best_dist = d
            best = s

    return {
        "nearest_city": best.city if best else None,
        "station_id": best.station_id if best else None,
        "latitude": best.latitude if best else None,
        "longitude": best.longitude if best else None,
        "distance_km": round(best_dist, 2) if best else None,
    }


@router.get("/nearest-station")
def nearest_station(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(50.0, ge=0.1, le=500, description="Max search radius"),
    db: Session = Depends(get_db),
):
    """Find the nearest monitoring station within a given radius."""
    stations = db.query(Station).filter(Station.is_active.is_(True)).all()

    candidates = []
    for s in stations:
        d = _haversine_km(lat, lng, s.latitude, s.longitude)
        if d <= radius_km:
            candidates.append({
                "station_id": s.station_id,
                "name": s.name,
                "city": s.city,
                "latitude": s.latitude,
                "longitude": s.longitude,
                "distance_km": round(d, 2),
            })

    candidates.sort(key=lambda x: x["distance_km"])
    return {
        "query": {"lat": lat, "lng": lng, "radius_km": radius_km},
        "results": candidates,
        "count": len(candidates),
    }
