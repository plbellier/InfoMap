from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from datetime import date

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    is_admin: bool = Field(default=False)
    is_active: bool = Field(default=False)
    max_daily_quota: int = Field(default=5)
    
    # Relationship to quotas
    quotas: list["DailyQuota"] = Relationship(back_populates="user")

class DailyQuota(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    date: str = Field(index=True)  # Format YYYY-MM-DD
    count: int = Field(default=0)
    
    # Relationship to user
    user: Optional[User] = Relationship(back_populates="quotas")
