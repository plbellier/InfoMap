import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from starlette.middleware.sessions import SessionMiddleware
import os
from unittest.mock import patch

def test_session_middleware_config():
    app = FastAPI()
    app.add_middleware(SessionMiddleware, secret_key="test-secret")
    
    client = TestClient(app)
    
    @app.get("/set-session")
    async def set_session(request: Request):
        request.session["test"] = "ok"
        return {"msg": "set"}
        
    @app.get("/get-session")
    async def get_session(request: Request):
        return {"val": request.session.get("test")}
        
    response = client.get("/set-session")
    assert response.status_code == 200
    
    response = client.get("/get-session")
    assert response.json()["val"] == "ok"

def test_google_env_vars_loading():
    # Mock environment before importing main or after if already imported
    with patch.dict(os.environ, {
        "GOOGLE_CLIENT_ID": "mock-id",
        "GOOGLE_CLIENT_SECRET": "mock-secret"
    }):
        # Force reload or just check if it would load
        import importlib
        import main
        importlib.reload(main)
        assert main.GOOGLE_CLIENT_ID == "mock-id"
        assert main.GOOGLE_CLIENT_SECRET == "mock-secret"
