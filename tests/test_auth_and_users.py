import pytest
from fastapi.testclient import TestClient
from app.main import app

# 1. 프로젝트의 DB 엔진 및 Base, User 모델 import
# (프로젝트 구조에 맞게 경로를 확인해 주세요. 예: app.core.database 또는 app.db.session)
from app.db.session import engine  # 또는 async_engine
from app.db.base import Base       # DeclarativeBase 객체
import app.models                  # User 모델이 Base.metadata에 등록되도록 import

client = TestClient(app)


# 2. 테스트 시작 전 테이블 생성 픽스처 추가
@pytest.fixture(autouse=True, scope="module")
def setup_database():
    # 동기 엔진인 경우:
    # Base.metadata.create_all(bind=engine)
    # yield
    # Base.metadata.drop_all(bind=engine)

    # 비동기 엔진(AsyncEngine / aiosqlite)을 사용하는 경우:
    import asyncio
    async def init_tables():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def drop_tables():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)

    asyncio.run(init_tables())
    yield
    asyncio.run(drop_tables())


def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_user_registration_and_login():
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