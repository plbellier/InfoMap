import pytest
from sqlmodel import SQLModel, create_engine, Session, select
from models import User, DailyQuota

# Use an in-memory SQLite for testing
DATABASE_URL = "sqlite://"
engine = create_engine(DATABASE_URL)

@pytest.fixture(name="session")
def session_fixture():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)

def test_create_user(session: Session):
    user = User(email="test@example.com", is_admin=False, max_daily_quota=5)
    session.add(user)
    session.commit()
    session.refresh(user)
    
    assert user.id is not None
    assert user.email == "test@example.com"
    assert user.max_daily_quota == 5
    assert user.is_admin is False

def test_admin_user(session: Session):
    user = User(email="pl.bellier@gmail.com", is_admin=True, max_daily_quota=9999)
    session.add(user)
    session.commit()
    
    statement = select(User).where(User.email == "pl.bellier@gmail.com")
    results = session.exec(statement)
    admin = results.one()
    
    assert admin.is_admin is True

def test_daily_quota_link(session: Session):
    user = User(email="user@example.com")
    session.add(user)
    session.commit()
    
    quota = DailyQuota(user_id=user.id, date="2026-01-24", count=1)
    session.add(quota)
    session.commit()
    
    assert quota.user_id == user.id
