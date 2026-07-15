from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.postgres import get_db
from app.models.user import User
from app.models.route import RouteQuery
from app.schemas.route import RouteRequest, RouteOut, RouteHistoryOut
from app.services.auth_service import get_current_user, get_optional_user
from app.services.route_service import evaluate_routes

router = APIRouter()


@router.post("", response_model=RouteOut, status_code=status.HTTP_200_OK)
def get_route(
    payload: RouteRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    """
    Evaluate one or more route alternatives between origin and destination,
    scoring each waypoint by its predicted / live AQI value and returning
    the healthiest option as the recommendation.
    """
    try:
        route_out = evaluate_routes(payload, db, current_user)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Route evaluation failed: {exc}",
        ) from exc
    return route_out


@router.get("/history", response_model=list[RouteHistoryOut])
def get_route_history(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the authenticated user's past route queries (most recent first)."""
    queries = (
        db.query(RouteQuery)
        .filter(RouteQuery.user_id == current_user.id)
        .order_by(RouteQuery.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        RouteHistoryOut(
            id=q.id,
            origin_lat=q.origin_lat,
            origin_lon=q.origin_lon,
            dest_lat=q.dest_lat,
            dest_lon=q.dest_lon,
            origin_label=q.origin_label,
            dest_label=q.dest_label,
            avg_aqi=q.avg_aqi,
            recommendation=q.recommendation,
            created_at=q.created_at.isoformat(),
        )
        for q in queries
    ]


@router.get("/{route_query_id}", response_model=RouteOut)
def get_route_detail(
    route_query_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve the full result of a previously evaluated route query by ID.
    Only the owning user may access their own queries.
    """
    q = (
        db.query(RouteQuery)
        .filter(
            RouteQuery.id == route_query_id,
            RouteQuery.user_id == current_user.id,
        )
        .first()
    )
    if not q:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Route query not found.",
        )

    from app.schemas.route import Coordinate, RouteAlternative, RouteWaypointOut

    # Group waypoints by alternative index
    alternatives: dict[int, list] = {}
    for wp in q.waypoints:
        alternatives.setdefault(wp.alternative_index, []).append(wp)

    alt_list = []
    for alt_idx, wps in sorted(alternatives.items()):
        waypoint_outs = [
            RouteWaypointOut(
                latitude=wp.latitude,
                longitude=wp.longitude,
                station_id=wp.station_id,
                aqi=wp.aqi,
                category=wp.category,
                source=wp.source,
            )
            for wp in wps
        ]
        aqis = [wp.aqi for wp in wps if wp.aqi is not None]
        alt_list.append(
            RouteAlternative(
                alternative_index=alt_idx,
                waypoints=waypoint_outs,
                avg_aqi=round(sum(aqis) / len(aqis), 2) if aqis else None,
                max_aqi=round(max(aqis), 2) if aqis else None,
            )
        )

    return RouteOut(
        origin=Coordinate(latitude=q.origin_lat, longitude=q.origin_lon),
        destination=Coordinate(latitude=q.dest_lat, longitude=q.dest_lon),
        alternatives=alt_list,
        recommended_index=q.recommended_route_index or 0,
        recommendation=q.recommendation or "",
        route_query_id=q.id,
    )
