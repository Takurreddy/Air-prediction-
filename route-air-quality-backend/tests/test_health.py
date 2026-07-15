"""
Health-check endpoint smoke test.
Verifies the /health route returns 200 and the expected JSON shape even when
InfluxDB is not reachable (the ping is best-effort and never raises).
"""


def test_health_returns_200(client):
    response = client.get("/health")
    assert response.status_code == 200


def test_health_response_shape(client):
    data = client.get("/health").json()
    assert data["status"] == "ok"
    assert "services" in data
    assert "influxdb" in data["services"]
