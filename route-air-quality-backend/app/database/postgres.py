"""
PostgreSQL session factory via SQLAlchemy 2.0 (sync engine).
Async engine URL is available on settings for Alembic / future async routes.
"""
from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from typing import Generator

from app.core.config import settings

# ── Declarative base (shared by all ORM models) ───────────────────────────────
class Base(DeclarativeBase):
    pass

# Import models so Base.metadata knows about them
import app.models.user
import app.models.station
import app.models.alert
import app.models.route
import app.models.prediction_history
import app.models.favorite_route
import app.models.notification
import app.models.saved_location
import app.models.otp_challenge

# ── Engine ────────────────────────────────────────────────────────────────────
try:
    engine = create_engine(
        settings.postgres_url,
        pool_pre_ping=True,       # recycles stale connections automatically
        pool_size=10,
        max_overflow=20,
        echo=False,
    )
    with engine.connect() as conn:
        pass
except Exception:
    engine = create_engine(
        "sqlite:///./air_quality.db",
        connect_args={"check_same_thread": False},
        echo=False,
    )

# Auto-create tables if they don't exist
Base.metadata.create_all(bind=engine)

# Add nullable auth fields to an existing local database on first start.
from sqlalchemy import inspect, text

with engine.begin() as connection:
    if "users" in inspect(engine).get_table_names():
        user_info = inspect(engine).get_columns("users")
        user_columns = {column["name"] for column in user_info}
        if "phone_number" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN phone_number VARCHAR(20)"))
        if engine.dialect.name == "postgresql":
            email_column = next(column for column in user_info if column["name"] == "email")
            if not email_column["nullable"]:
                connection.execute(text("ALTER TABLE users ALTER COLUMN email DROP NOT NULL"))

# ── Session factory ───────────────────────────────────────────────────────────
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


# ── FastAPI dependency ────────────────────────────────────────────────────────
def get_db() -> Generator[Session, None, None]:
    """
    Yield a database session and guarantee it is closed after the request,
    even if an exception is raised.

    Usage in a router:
        @router.get("/example")
        def example(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
