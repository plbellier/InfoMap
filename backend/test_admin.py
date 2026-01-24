import pytest
from fastapi.testclient import TestClient
from main import app, get_current_user
from models import User
from sqlmodel import Session, create_engine, SQLModel

# Setup mock DB for these tests
DATABASE_URL = "sqlite://"
engine = create_engine(DATABASE_URL)
SQLModel.metadata.create_all(engine)

@pytest.fixture
def client():
    # Mock current user as admin
    app.dependency_overrides[get_current_user] = lambda: {"email": "pl.bellier@gmail.com"}
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def test_list_users_admin(client):
    response = client.get("/admin/users")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_update_quota_admin(client):
    # Create user by calling /me or similar, or just know get_or_create_user is called
    target_email = "user@test.com"
    
    # We can't easily call /me for ANOTHER user, so let's mock their creation
    from main import db_service
    db_service.get_or_create_user(target_email)
    
    payload = {"email": target_email, "max_daily_quota": 50}
    response = client.post("/admin/quota", json=payload)
    assert response.status_code == 200
    assert response.json()["new_quota"] == 50

def test_unauthorized_admin_access():
    # Mock current user as NON-admin
    app.dependency_overrides[get_current_user] = lambda: {"email": "regular@user.com"}
    client = TestClient(app)
    
    response = client.get("/admin/users")
    assert response.status_code == 403
    
    app.dependency_overrides.clear()
