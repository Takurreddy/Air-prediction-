"""
Alembic migration environment.

Supports both offline (--sql) and online (live DB connection) modes.
The database URL is pulled from app.core.config.settings so there is a
single source of truth for all connection strings.
"""
from __future__ import annotations

import logging
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

# Inject the runtime DB URL so alembic.ini's placeholder is never used
config.set_main_option("sqlalchemy.url", settings.postgres_url)

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
    url = config.get_main_option("sqlalchemy.url")
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
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
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
