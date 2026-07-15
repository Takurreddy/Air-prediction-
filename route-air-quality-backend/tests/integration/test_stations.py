"""
Integration tests for the /stations router.
"""

STATION_PAYLOAD = {
    "station_id": "TEST-001",
    "name": "Test Station Alpha",
    "city": "Bangalore",
    "country": "IN",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "source_api": "manual",
}


def test_create_station_returns_201(client):
    response = client.post("/stations", json=STATION_PAYLOAD)
    assert response.status_code == 201
    data = response.json()
    assert data["station_id"] == STATION_PAYLOAD["station_id"]
    assert data["city"] == STATION_PAYLOAD["city"]


def test_create_duplicate_station_returns_409(client):
    client.post("/stations", json=STATION_PAYLOAD)
    response = client.post("/stations", json=STATION_PAYLOAD)
    assert response.status_code == 409


def test_list_stations_returns_created_station(client):
    client.post("/stations", json=STATION_PAYLOAD)
    response = client.get("/stations", params={"city": "Bangalore"})
    assert response.status_code == 200
    ids = [s["station_id"] for s in response.json()]
    assert STATION_PAYLOAD["station_id"] in ids


def test_get_station_by_id(client):
    client.post("/stations", json=STATION_PAYLOAD)
    response = client.get(f"/stations/{STATION_PAYLOAD['station_id']}")
    assert response.status_code == 200
    assert response.json()["station_id"] == STATION_PAYLOAD["station_id"]


def test_get_nonexistent_station_returns_404(client):
    response = client.get("/stations/DOES-NOT-EXIST")
    assert response.status_code == 404
