import pytest
from sqlmodel import SQLModel, create_engine, Session
from database import DatabaseService
from models import User
from datetime import datetime

# Use an in-memory SQLite for testing
DATABASE_URL = "sqlite://"

@pytest.fixture(name="db_service")
def db_service_fixture():
    engine = create_engine(DATABASE_URL)
    SQLModel.metadata.create_all(engine)
    service = DatabaseService(engine)
    yield service
    SQLModel.metadata.drop_all(engine)

def test_get_or_create_user(db_service):
    email = "newuser@example.com"
    user = db_service.get_or_create_user(email)
    
    assert user.email == email
    assert user.id is not None
    
    # Get again, should be the same
    user2 = db_service.get_or_create_user(email)
    assert user.id == user2.id

def test_quota_management(db_service):
    email = "quota@example.com"
    user = db_service.get_or_create_user(email)
    today = datetime.now().strftime('%Y-%m-%d')
    
    # Initially 0
    count = db_service.get_daily_count(user.id, today)
    assert count == 0
    
    # Increment
    new_count = db_service.increment_quota(user.id, today)
    assert new_count == 1
    
    # Check again
    assert db_service.get_daily_count(user.id, today) == 1

def test_quota_exceeded(db_service):
    email = "limited@example.com"
    user = db_service.get_or_create_user(email)
    user_id = user.id
    
    with Session(db_service.engine) as session:
        user_to_update = session.get(User, user_id)
        user_to_update.max_daily_quota = 2
        session.add(user_to_update)
        session.commit()
        
    today = datetime.now().strftime('%Y-%m-%d')
    
    db_service.increment_quota(user_id, today)
    db_service.increment_quota(user_id, today)
    
    assert db_service.has_quota_remaining(email, today) is False
