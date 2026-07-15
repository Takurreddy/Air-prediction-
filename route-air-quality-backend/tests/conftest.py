"""
Shared pytest fixtures for unit, integration, and contract tests.

The TestClient is built against a FastAPI app that overrides the real
database and InfluxDB dependencies with lightweight in-memory replacements,
so no live services are required to run the test suite.
"""
from __future__ import annotations

import os
import pytest

# ── Set dummy env vars BEFORE importing any app code ─────────────────────────
os.environ.setdefault("POSTGRES_USER",       "test")
os.environ.setdefault("POSTGRES_PASSWORD",   "test")
os.environ.setdefault("POSTGRES_DB",         "test")
os.environ.setdefault("POSTGRES_HOST",       "localhost")
os.environ.setdefault("INFLUX_URL",          "http://localhost:8086")
os.environ.setdefault("INFLUX_TOKEN",        "test-token")
os.environ.setdefault("INFLUX_ORG",          "test-org")
os.environ.setdefault("INFLUX_BUCKET",       "test-bucket")
os.environ.setdefault("REDIS_HOST",          "localhost")
os.environ.setdefault("JWT_SECRET_KEY",      "test-secret-key-for-tests-only")
os.environ.setdefault("ML_MODEL_PATH",       "nonexistent/model")
os.environ.setdefault("ML_SCALER_PATH",      "nonexistent/scaler.pkl")

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.postgres import Base, get_db
from app.main import app

# ── In-memory SQLite DB (replaces Postgres for tests) ────────────────────────
_TEST_DB_URL = "sqlite:///:memory:"

_engine = create_engine(
    _TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_TestingSession = sessionmaker(bind=_engine, autocommit=False, autoflush=False)


def _override_get_db():
    db = _TestingSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    """Create all ORM tables once for the entire test session."""
    Base.metadata.create_all(bind=_engine)
    yield
    Base.metadata.drop_all(bind=_engine)


@pytest.fixture()
def db():
    """Yield a fresh DB session and roll back after each test."""
    connection = _engine.connect()
    transaction = connection.begin()
    session = _TestingSession(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db):
    """
    FastAPI TestClient with the real Postgres dependency swapped for
    the in-memory SQLite session.
    """
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    app.dependency_overrides.clear()
