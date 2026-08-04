#!/usr/bin/env python3
"""
init_db.py
----------
Creates all Postgres tables defined in the ORM models.
Safe to run multiple times — CREATE TABLE IF NOT EXISTS semantics via SQLAlchemy.

Usage (inside the backend container):
    python scripts/init_db.py
"""
import sys
import os

# Make sure app/ is importable when run from /app inside the container
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)

from app.database.postgres import Base, engine

# Import every model so SQLAlchemy registers its table with Base.metadata
import app.models.user               # noqa: F401
import app.models.station            # noqa: F401
import app.models.alert              # noqa: F401
import app.models.route              # noqa: F401
import app.models.prediction_history # noqa: F401
import app.models.favorite_route     # noqa: F401
import app.models.notification       # noqa: F401
import app.models.saved_location     # noqa: F401

def main() -> int:
    log.info("Connecting to: %s", engine.url)
    log.info("Tables to create: %s", list(Base.metadata.tables.keys()))
    try:
        Base.metadata.create_all(bind=engine)
        log.info("✓ All tables created (or already exist).")
        return 0
    except Exception as exc:
        log.error("✗ Failed to create tables: %s", exc)
        return 1

if __name__ == "__main__":
    sys.exit(main())
