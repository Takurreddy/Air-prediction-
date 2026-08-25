from urllib.parse import quote_plus
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── PostgreSQL ────────────────────────────────────────────────────────────
    postgres_user: str
    postgres_password: str
    postgres_db: str
    postgres_host: str
    postgres_port: int = 5432

    # ── InfluxDB ──────────────────────────────────────────────────────────────
    influx_url: str
    influx_token: str
    influx_org: str
    influx_bucket: str
    influx_admin_password: str = ""

    # ── Redis (caching route AQI results) ─────────────────────────────────────
    redis_host: str = "redis"
    redis_port: int = 6379
    redis_ttl_seconds: int = 300          # how long to cache route AQI results

    # ── MinIO (ML artifact storage) ───────────────────────────────────────────
    minio_endpoint: str = "http://minio:9000"
    minio_root_user: str = ""
    minio_root_password: str = ""
    minio_bucket_ml: str = "ml-artifacts"

    # ── Auth ──────────────────────────────────────────────────────────────────
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    clerk_enabled: bool = False
    clerk_jwks_url: str = "https://api.clerk.com/v1/jwks"
    clerk_issuer: str = ""
    clerk_audience: str = ""

    # ── External APIs ─────────────────────────────────────────────────────────
    openaq_api_key: str = ""          # OpenAQ — historical air quality data
    waqi_api_key: str = ""            # World Air Quality Index
    openweather_api_key: str = ""     # meteorology data
    cpcb_api_key: str = ""            # India CPCB — Central Pollution Control Board

    # Routing provider — set ONE of the following
    google_maps_api_key: str = ""     # Google Maps Directions API
    osrm_base_url: str = "http://router.project-osrm.org"  # free OSRM fallback

    # ── Firebase (push notifications) ─────────────────────────────────────────
    firebase_credentials_path: str = "./firebase-credentials.json"

    # ── SMTP (email alerts) ───────────────────────────────────────────────────
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""

    # ── ML artifact paths (resolved at runtime inside the container) ──────────
    ml_model_path: str = "ml/lstm_air_quality_model.keras"
    ml_scaler_path: str = "ml/time_scaler.pkl"

    # ── Route scoring tunables ────────────────────────────────────────────────
    # Radius (km) within which a monitoring station is considered "nearby"
    route_station_radius_km: float = 2.0
    # Number of alternative routes to evaluate (1 = straight + 1 alt, etc.)
    route_max_alternatives: int = 3
    # How many hours of history to use as LSTM lookback input
    lstm_lookback_hours: int = 24

    @property
    def postgres_url(self) -> str:
        import socket
        host = self.postgres_host
        if host == "postgres":
            try:
                socket.gethostbyname(host)
            except socket.gaierror:
                host = "127.0.0.1"
        user = quote_plus(self.postgres_user)
        pwd  = quote_plus(self.postgres_password)
        return (
            f"postgresql://{user}:{pwd}"
            f"@{host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def postgres_url_async(self) -> str:
        # quote_plus encodes special characters (@, #, %, etc.) in credentials
        user = quote_plus(self.postgres_user)
        pwd  = quote_plus(self.postgres_password)
        return (
            f"postgresql+asyncpg://{user}:{pwd}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def influx_url_resolved(self) -> str:
        import socket
        url = self.influx_url
        if "://influxdb:" in url:
            try:
                socket.gethostbyname("influxdb")
            except socket.gaierror:
                url = url.replace("://influxdb:", "://127.0.0.1:")
        return url

    model_config = {"env_file": ".env"}


settings = Settings()
