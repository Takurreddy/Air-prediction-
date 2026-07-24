"""
Unit tests for route_service scoring and LSTM prediction fallback.
"""
import os
os.environ.setdefault("POSTGRES_USER", "test")
os.environ.setdefault("POSTGRES_PASSWORD", "test")
os.environ.setdefault("POSTGRES_DB", "test")
os.environ.setdefault("POSTGRES_HOST", "localhost")
os.environ.setdefault("INFLUX_URL", "http://localhost:8086")
os.environ.setdefault("INFLUX_TOKEN", "test-token")
os.environ.setdefault("INFLUX_ORG", "test-org")
os.environ.setdefault("INFLUX_BUCKET", "test-bucket")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-tests-only")

import pytest
from unittest.mock import MagicMock, patch

from app.schemas.route import Coordinate, RouteRequest
from app.services.route_service import _get_aqi_for_point, evaluate_routes


def test_get_aqi_for_point_live_data():
    mock_record = MagicMock()
    mock_record.values = {"latitude": 28.61, "longitude": 77.20, "station_id": "s1"}
    mock_record.get_value.return_value = 45.0

    mock_table = MagicMock()
    mock_table.records = [mock_record]

    with patch("app.services.route_service.influx_db.query_nearest_station_aqi", return_value=[mock_table]):
        aqi, cat, source = _get_aqi_for_point(28.61, 77.20)
        assert aqi == 45.0
        assert cat == "Good"
        assert source == "live"


def test_get_aqi_for_point_lstm_fallback():
    # Mock live lookup returning nothing
    with patch("app.services.route_service.influx_db.query_nearest_station_aqi", return_value=[]):
        # Mock Postgres station query
        mock_station = MagicMock()
        mock_station.station_id = "s1"
        mock_station.city = "Delhi"
        mock_station.latitude = 28.61
        mock_station.longitude = 77.20
        mock_station.is_active = True

        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.all.return_value = [mock_station]

        # Mock InfluxDB stored prediction query
        mock_pred_record = MagicMock()
        mock_pred_record.values = {"predicted_aqi": 82.5}
        mock_pred_table = MagicMock()
        mock_pred_table.records = [mock_pred_record]

        with patch("app.services.route_service.influx_db.query_predictions", return_value=[mock_pred_table]):
            aqi, cat, source = _get_aqi_for_point(28.61, 77.20, db=mock_db)
            assert aqi == 82.5
            assert cat == "Moderate"
            assert source == "predicted_lstm"


def test_evaluate_routes_fallback_flow():
    req = RouteRequest(
        origin_lat=28.6139,
        origin_lon=77.2090,
        dest_lat=28.7041,
        dest_lon=77.1025,
    )
    mock_db = MagicMock()

    with patch("app.services.route_service._fetch_routes", return_value=[[Coordinate(latitude=28.6139, longitude=77.2090)]]), \
         patch("app.services.route_service._get_aqi_for_point", return_value=(60.0, "Moderate", "predicted_lstm")):
        
        result = evaluate_routes(req, db=mock_db, user=None)
        assert len(result.alternatives) == 1
        assert result.alternatives[0].waypoints[0].aqi == 60.0
        assert result.alternatives[0].waypoints[0].source == "predicted_lstm"
        assert result.recommended_index == 0
        assert "healthiest option" in result.recommendation
