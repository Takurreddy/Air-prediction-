from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    auth,
    stations,
    readings,
    predictions,
    routes,
    favorite_routes,
    notifications,
    saved_locations,
    prediction_history,
)
from app.database import influx as influx_db

log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── startup ──────────────────────────────────────────────────────────────
    result = influx_db.ping()
    if result["ok"]:
        log.info("InfluxDB connection verified on startup.")
    else:
        log.warning("InfluxDB not reachable on startup: %s", result["detail"])
    yield
    # ── shutdown ─────────────────────────────────────────────────────────────
    influx_db.close_client()


app = FastAPI(
    title="Route Air Quality Prediction API",
    description=(
        "Predict air quality along travel routes and suggest healthier "
        "alternatives using an LSTM model trained on historical sensor data."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten before production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,               prefix="/auth",               tags=["auth"])
app.include_router(stations.router,           prefix="/stations",           tags=["stations"])
app.include_router(readings.router,           prefix="/air-quality",        tags=["air-quality"])
app.include_router(predictions.router,        prefix="/predict",            tags=["predictions"])
app.include_router(routes.router,             prefix="/routes",             tags=["routes"])
app.include_router(favorite_routes.router,    prefix="/favorite-routes",    tags=["favorite-routes"])
app.include_router(notifications.router,      prefix="/notifications",      tags=["notifications"])
app.include_router(saved_locations.router,    prefix="/saved-locations",    tags=["saved-locations"])
app.include_router(prediction_history.router, prefix="/prediction-history", tags=["prediction-history"])


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
def health_check():
    """Liveness + dependency health check."""
    influx_status = influx_db.ping()
    return {
        "status": "ok",
        "services": {
            "influxdb": influx_status,
        },
    }
