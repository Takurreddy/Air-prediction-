"""
Unit tests for the ML interface helpers.
No model files are required — the stub predictor path is exercised instead.
"""
import pytest

from app.services.ml_interface import (
    _pm25_to_aqi,
    categorize_aqi,
    predict_aqi,
    FEATURE_ORDER,
    SEQ_LENGTH,
)


# ── AQI formula ───────────────────────────────────────────────────────────────

@pytest.mark.parametrize("pm25,expected_category", [
    (0.0,   "Good"),
    (5.0,   "Good"),
    (12.0,  "Good"),
    (12.1,  "Moderate"),
    (35.4,  "Moderate"),
    (35.5,  "Unhealthy for Sensitive Groups"),
    (55.5,  "Unhealthy"),
    (150.5, "Very Unhealthy"),
    (250.5, "Hazardous"),
    (600.0, "Hazardous"),
])
def test_categorize_aqi_boundaries(pm25, expected_category):
    aqi = _pm25_to_aqi(pm25)
    assert categorize_aqi(aqi) == expected_category


def test_pm25_to_aqi_good_range():
    assert _pm25_to_aqi(0.0) == 0.0
    assert _pm25_to_aqi(12.0) == 50.0


def test_pm25_to_aqi_beyond_scale():
    assert _pm25_to_aqi(999.0) == 500.0


# ── FEATURE_ORDER completeness ────────────────────────────────────────────────

def test_feature_order_length():
    assert len(FEATURE_ORDER) == 15


def test_feature_order_contains_required_pollutants():
    for col in ("PM2.5", "PM10", "NO2", "SO2"):
        assert col in FEATURE_ORDER


# ── Stub predictor ────────────────────────────────────────────────────────────

def _make_sequence(pm25: float = 10.0) -> list[dict]:
    """Build a minimal 24-step sequence for the stub predictor."""
    step = {f: 0.0 for f in FEATURE_ORDER}
    step["PM2.5"] = pm25
    return [step] * SEQ_LENGTH


def test_predict_aqi_returns_expected_keys():
    result = predict_aqi("test-station", _make_sequence())
    expected_keys = {"station_id", "pm25", "pm10", "no2", "so2",
                     "predicted_aqi", "category", "model_version"}
    assert expected_keys == set(result.keys())


def test_predict_aqi_stub_uses_last_timestep():
    # Stub predictor echoes last-timestep PM2.5 directly
    result = predict_aqi("s1", _make_sequence(pm25=10.0))
    assert result["pm25"] == pytest.approx(10.0, abs=0.01)
    assert result["model_version"] == "stub-v0"


def test_predict_aqi_wrong_sequence_length():
    with pytest.raises(ValueError, match="exactly 24"):
        predict_aqi("s1", _make_sequence()[:10])


def test_predict_aqi_none_values_treated_as_zero():
    seq = [{f: None for f in FEATURE_ORDER}] * SEQ_LENGTH
    result = predict_aqi("s1", seq)
    assert result["pm25"] == 0.0
    assert result["predicted_aqi"] == 0.0
