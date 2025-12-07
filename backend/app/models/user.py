from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from pydantic import BaseModel, EmailStr
from app.db.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    learning_style = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

# Pydantic schemas
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str = None
    learning_style: str = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    learning_style: str
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
