import pytest
from fastapi.testclient import TestClient
from main import app, oauth
from unittest.mock import MagicMock, patch

client = TestClient(app)

def test_login_route():
    # Test redirection to Google
    response = client.get("/login", follow_redirects=False)
    assert response.status_code in [302, 307]
    assert "accounts.google.com" in response.headers["location"]

@pytest.mark.asyncio
async def test_auth_callback():
    # Mock the authorize_access_token and userinfo
    mock_token = {"access_token": "mock-token", "id_token": "mock-id-token"}
    mock_userinfo = {"email": "testuser@example.com", "name": "Test User"}
    
    with patch("main.oauth.google.authorize_access_token") as mock_authorize:
        mock_authorize.return_value = mock_token
        with patch("main.oauth.google.parse_id_token") as mock_parse:
            mock_parse.return_value = mock_userinfo
            
            # Simulate the callback
            response = client.get("/auth", follow_redirects=False)
            
            assert response.status_code in [302, 307]
            assert "localhost:5173" in response.headers["location"]
            
def test_logout():
    response = client.get("/logout", follow_redirects=False)
    assert response.status_code in [302, 307]
    assert "localhost:5173" in response.headers["location"]

def test_me_unauthenticated():
    response = client.get("/me")
    assert response.status_code == 200
    assert response.json() == {"authenticated": False}
