"""
Integration tests for the /auth router.
Uses the in-memory SQLite DB via the `client` fixture in conftest.py.
"""


SIGNUP_PAYLOAD = {
    "full_name": "Test User",
    "email": "testuser@example.com",
    "password": "supersecret123",
}


def test_signup_returns_201_and_token(client):
    response = client.post("/auth/signup", json=SIGNUP_PAYLOAD)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] > 0


def test_signup_duplicate_email_returns_409(client):
    client.post("/auth/signup", json=SIGNUP_PAYLOAD)
    response = client.post("/auth/signup", json=SIGNUP_PAYLOAD)
    assert response.status_code == 409


def test_login_with_correct_credentials(client):
    client.post("/auth/signup", json=SIGNUP_PAYLOAD)
    response = client.post(
        "/auth/login",
        json={
            "email": SIGNUP_PAYLOAD["email"],
            "password": SIGNUP_PAYLOAD["password"],
        },
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_with_wrong_password_returns_401(client):
    client.post("/auth/signup", json=SIGNUP_PAYLOAD)
    response = client.post(
        "/auth/login",
        json={
            "email": SIGNUP_PAYLOAD["email"],
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 401


def test_get_me_requires_auth(client):
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_get_me_returns_profile(client):
    signup_resp = client.post("/auth/signup", json=SIGNUP_PAYLOAD)
    token = signup_resp.json()["access_token"]

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == SIGNUP_PAYLOAD["full_name"]
    assert data["email"] == SIGNUP_PAYLOAD["email"]
