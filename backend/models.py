from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from datetime import date, datetime

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    is_admin: bool = Field(default=False)
    is_active: bool = Field(default=False)
    max_daily_quota: int = Field(default=5)
    
    # Relationship to quotas
    quotas: list["DailyQuota"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    # Relationship to history
    history: list["QueryHistory"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

class DailyQuota(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    date: str = Field(index=True)  # Format YYYY-MM-DD
    count: int = Field(default=0)
    
    # Relationship to user
    user: Optional[User] = Relationship(back_populates="quotas")

class QueryHistory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    country: str
    time_filter: str
    topic: str
    news_json: str  # Stored as JSON string
    stats_json: Optional[str] = None  # Stored as JSON string
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationship to user
    user: Optional[User] = Relationship(back_populates="history")
