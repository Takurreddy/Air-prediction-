"""
Contract tests — verify the OpenAPI schema is generated and contains the
expected paths and HTTP methods so downstream clients stay in sync.
"""

EXPECTED_PATHS = {
    "/health":                          {"get"},
    "/auth/signup":                     {"post"},
    "/auth/login":                      {"post"},
    "/auth/me":                         {"get", "patch"},
    "/stations":                        {"get", "post"},
    "/stations/{station_id}":           {"get"},
    "/air-quality":                     {"get"},
    "/air-quality/history":             {"get"},
    "/air-quality/history/predictions": {"get"},
    "/air-quality/alerts":              {"get", "post"},
    "/air-quality/alerts/{alert_id}":   {"delete"},
    "/predict":                         {"post"},
    "/routes":                          {"post"},
    "/routes/history":                  {"get"},
    "/routes/{route_query_id}":         {"get"},
}


def test_openapi_schema_available(client):
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert "openapi" in response.json()


def test_expected_paths_present(client):
    schema = client.get("/openapi.json").json()
    actual_paths = set(schema.get("paths", {}).keys())

    missing = set(EXPECTED_PATHS.keys()) - actual_paths
    assert not missing, f"Missing paths in OpenAPI schema: {missing}"


def test_expected_methods_present(client):
    schema = client.get("/openapi.json").json()
    paths = schema.get("paths", {})

    for path, expected_methods in EXPECTED_PATHS.items():
        actual_methods = {m.lower() for m in paths.get(path, {}).keys()}
        missing = expected_methods - actual_methods
        assert not missing, (
            f"Path '{path}' is missing methods: {missing}. "
            f"Found: {actual_methods}"
        )
