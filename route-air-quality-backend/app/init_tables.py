"""Temporary bootstrap script — run once to create all DB tables."""
import sys
import os
# Ensure /app is on the path so `app.*` imports resolve
sys.path.insert(0, "/app")

import app.models.user
import app.models.station
import app.models.alert
import app.models.route
import app.models.prediction_history
import app.models.favorite_route
import app.models.notification
import app.models.saved_location
from app.database.postgres import Base, engine

Base.metadata.create_all(bind=engine)
print("ALL TABLES CREATED OK")
print("Tables:", list(Base.metadata.tables.keys()))
