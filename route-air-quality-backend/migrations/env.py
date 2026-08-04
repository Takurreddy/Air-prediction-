"""
Alembic migration environment.
"""
from __future__ import annotations

import logging
import sys
import os

# Ensure the project root (/app) is on sys.path so `app.*` imports work
# whether alembic is invoked from inside or outside the container.
_project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# ── Import application metadata ───────────────────────────────────────────────
# Each import registers the model's table with Base.metadata so Alembic can
# detect schema changes automatically via --autogenerate.
from app.database.postgres import Base  # noqa: F401

import app.models.user                # noqa: F401
import app.models.station             # noqa: F401
import app.models.alert               # noqa: F401
import app.models.route               # noqa: F401
import app.models.prediction_history  # noqa: F401
import app.models.favorite_route      # noqa: F401
import app.models.notification        # noqa: F401
import app.models.saved_location      # noqa: F401

from app.core.config import settings

# ── Alembic config ────────────────────────────────────────────────────────────
config = context.config

# Wire up Python logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

log = logging.getLogger("alembic.env")
target_metadata = Base.metadata


# ── Offline mode ──────────────────────────────────────────────────────────────

def run_migrations_offline() -> None:
    """
    Emit SQL to stdout without opening a DB connection.
    Useful for reviewing migrations or deploying via CI.
    """
    url = settings.postgres_url
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


# ── Online mode ───────────────────────────────────────────────────────────────

def run_migrations_online() -> None:
    """
    Open a real DB connection and apply pending migrations.
    """
    from sqlalchemy import create_engine
    connectable = create_engine(
        settings.postgres_url,
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,            # detect column-type changes
            compare_server_default=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    log.info("Running migrations in offline mode.")
    run_migrations_offline()
else:
    log.info("Running migrations in online mode.")
    run_migrations_online()
