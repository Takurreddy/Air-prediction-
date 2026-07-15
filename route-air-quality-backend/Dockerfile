# ── builder ───────────────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder
WORKDIR /build

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── runtime ───────────────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime
WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Application source
COPY ./app ./app

# Alembic migrations + config (needed for `docker compose exec backend alembic ...`)
COPY ./migrations ./migrations
COPY ./alembic.ini ./alembic.ini

# ML artifacts (model directory + scaler)
# These are bind-mounted at runtime via docker-compose volumes;
# COPY ensures they are baked in when building a portable image.
COPY ./ml ./ml

# Non-root user for security
RUN useradd --no-create-home --shell /bin/false appuser
USER appuser

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
