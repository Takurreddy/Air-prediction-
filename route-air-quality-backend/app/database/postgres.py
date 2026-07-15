"""
PostgreSQL session factory via SQLAlchemy 2.0 (sync engine).
Async engine URL is available on settings for Alembic / future async routes.
"""
from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from typing import Generator

from app.core.config import settings

# ── Engine ────────────────────────────────────────────────────────────────────
engine = create_engine(
    settings.postgres_url,
    pool_pre_ping=True,       # recycles stale connections automatically
    pool_size=10,
    max_overflow=20,
    echo=False,               # set True to log all SQL (useful for dev)
)

# ── Session factory ───────────────────────────────────────────────────────────
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


# ── Declarative base (shared by all ORM models) ───────────────────────────────
class Base(DeclarativeBase):
    pass


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
