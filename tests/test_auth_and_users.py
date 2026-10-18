import pytest
from fastapi.testclient import TestClient
from app.main import app


# lifespan(init_db 포함)을 확실하게 실행해 주는 fixture
@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health_check(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_user_registration_and_login(client: TestClient):
    email = "testuser@example.com"
    password = "securepassword123"

    # 1. Register
    response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Test User"},
    )
    assert response.status_code in [201, 400]

    # 2. Login
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Get Profile
    profile_response = client.get("/api/v1/auth/me", headers=headers)
    assert profile_response.status_code == 200
    assert profile_response.json()["email"] == email

    # 4. Update Preferences
    pref_response = client.put(
        "/api/v1/users/preferences",
        headers=headers,
        json={"preferred_categories": "IT/테크,경제", "preferred_keywords": "AI,반도체"},
    )
    assert pref_response.status_code == 200
    assert pref_response.json()["preferred_categories"] == "IT/테크,경제"

    # 5. Get Preferences
    get_pref_response = client.get("/api/v1/users/preferences", headers=headers)
    assert get_pref_response.status_code == 200
    assert get_pref_response.json()["preferred_keywords"] == "AI,반도체"

    # 6. Test Personalized Feed
    feed_response = client.get("/api/v1/users/feed", headers=headers)
    assert feed_response.status_code == 200
    assert isinstance(feed_response.json(), list)