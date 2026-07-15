import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.postgres import get_db
from app.models.favorite_route import FavoriteRoute
from app.models.user import User
from app.schemas.favorite_route import FavoriteRouteCreate, FavoriteRouteOut, FavoriteRouteUpdate
from app.services.auth_service import get_current_user

router = APIRouter()


@router.get("", response_model=list[FavoriteRouteOut])
def list_favorite_routes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all active saved routes for the authenticated user."""
    return (
        db.query(FavoriteRoute)
        .filter(
            FavoriteRoute.user_id == current_user.id,
            FavoriteRoute.is_active.is_(True),
        )
        .order_by(FavoriteRoute.created_at.desc())
        .all()
    )


@router.post("", response_model=FavoriteRouteOut, status_code=status.HTTP_201_CREATED)
def create_favorite_route(
    payload: FavoriteRouteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Save a new route.
    origin, destination and waypoints are stored as-is.
    route_geometry and aqi_exposure_profile are populated later by the
    scheduler (nightly refresh job).
    """
    route = FavoriteRoute(
        user_id=current_user.id,
        name=payload.name,
        origin=payload.origin.model_dump(),
        destination=payload.destination.model_dump(),
        waypoints=[wp.model_dump() for wp in payload.waypoints] or None,
    )
    db.add(route)
    db.commit()
    db.refresh(route)
    return route


@router.get("/{route_id}", response_model=FavoriteRouteOut)
def get_favorite_route(
    route_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve a single saved route by ID."""
    route = _get_owned_route(route_id, current_user.id, db)
    return route


@router.patch("/{route_id}", response_model=FavoriteRouteOut)
def update_favorite_route(
    route_id: uuid.UUID,
    payload: FavoriteRouteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Rename a route or change its endpoints / waypoints."""
    route = _get_owned_route(route_id, current_user.id, db)

    if payload.name is not None:
        route.name = payload.name
    if payload.origin is not None:
        route.origin = payload.origin.model_dump()
    if payload.destination is not None:
        route.destination = payload.destination.model_dump()
    if payload.waypoints is not None:
        route.waypoints = [wp.model_dump() for wp in payload.waypoints] or None

    # Invalidate cached exposure profile — scheduler will recompute it
    route.aqi_exposure_profile = None
    route.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(route)
    return route


@router.delete("/{route_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_favorite_route(
    route_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft-archive a saved route (sets is_active = False)."""
    route = _get_owned_route(route_id, current_user.id, db)
    route.is_active = False
    route.updated_at = datetime.now(timezone.utc)
    db.commit()


# ── helpers ───────────────────────────────────────────────────────────────────

def _get_owned_route(
    route_id: uuid.UUID, user_id: uuid.UUID, db: Session
) -> FavoriteRoute:
    route = (
        db.query(FavoriteRoute)
        .filter(
            FavoriteRoute.id == route_id,
            FavoriteRoute.user_id == user_id,
            FavoriteRoute.is_active.is_(True),
        )
        .first()
    )
    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite route not found.",
        )
    return route
