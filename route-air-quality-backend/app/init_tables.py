"""Temporary bootstrap script — run once to create all DB tables."""
import sys
import os
# Ensure app module is on the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import app.models.user
import app.models.station
import app.models.alert
import app.models.route
import app.models.prediction_history
import app.models.favorite_route
import app.models.notification
import app.models.saved_location
import app.models.otp_challenge
from app.database.postgres import Base, engine

Base.metadata.create_all(bind=engine)
print("ALL TABLES CREATED OK")
print("Tables:", list(Base.metadata.tables.keys()))
