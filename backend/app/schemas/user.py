from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.core import UserRole

# Data required to create a user
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[UserRole] = UserRole.citizen # Default to citizen

# Data returned when we fetch a user (hides password!)
class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True # Tells Pydantic to read SQLAlchemy models

# JWT Token Schema
class Token(BaseModel):
    access_token: str
    token_type: str