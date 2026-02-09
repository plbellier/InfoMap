from sqlmodel import Session, select, create_engine, SQLModel
from models import User, DailyQuota
from datetime import datetime
from zoneinfo import ZoneInfo
import os

# Helper for Paris time in database service if needed (date is usually passed from main.py)
def get_paris_today():
    return datetime.now(ZoneInfo("Europe/Paris")).strftime('%Y-%m-%d')

# Admin email from environment variable (security improvement)
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "pl.bellier@gmail.com")

class DatabaseService:
    def __init__(self, engine):
        self.engine = engine

    def get_or_create_user(self, email: str) -> User:
        with Session(self.engine) as session:
            statement = select(User).where(User.email == email)
            user = session.exec(statement).first()
            
            if not user:
                # Default admin check using environment variable
                is_admin = (email == ADMIN_EMAIL)
                is_active = is_admin  # Only admin is active by default
                max_quota = 15 if is_admin else 5
                user = User(email=email, is_admin=is_admin, is_active=is_active, max_daily_quota=max_quota)
                session.add(user)
                session.commit()
                session.refresh(user)
            return user

    def get_daily_count(self, user_id: int, date_str: str) -> int:
        with Session(self.engine) as session:
            statement = select(DailyQuota).where(
                DailyQuota.user_id == user_id, 
                DailyQuota.date == date_str
            )
            quota = session.exec(statement).first()
            return quota.count if quota else 0

    def increment_quota(self, user_id: int, date_str: str) -> int:
        with Session(self.engine) as session:
            statement = select(DailyQuota).where(
                DailyQuota.user_id == user_id, 
                DailyQuota.date == date_str
            )
            quota = session.exec(statement).first()
            
            if not quota:
                quota = DailyQuota(user_id=user_id, date=date_str, count=1)
                session.add(quota)
            else:
                quota.count += 1
                session.add(quota)
            
            session.commit()
            session.refresh(quota)
            return quota.count

    def has_quota_remaining(self, email: str, date_str: str) -> bool:
        user = self.get_or_create_user(email)
        count = self.get_daily_count(user.id, date_str)
        return count < user.max_daily_quota

# Global instance initialization helper
def get_db_service(sqlite_url: str):
    engine = create_engine(sqlite_url)
    SQLModel.metadata.create_all(engine)
    return DatabaseService(engine)
