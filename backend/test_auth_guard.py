import pytest
from fastapi.testclient import TestClient
from main import app
from unittest.mock import patch

client = TestClient(app)

def test_protected_news_route():
    # Attempt to access news without login
    response = client.get("/news/France")
    assert response.status_code == 401
    assert "detail" in response.json()
    assert "Not authenticated" in response.json()["detail"]

def test_protected_quota_route():
    # Attempt to access quota without login
    response = client.get("/quota")
    assert response.status_code == 401
