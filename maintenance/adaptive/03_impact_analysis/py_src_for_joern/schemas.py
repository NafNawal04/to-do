from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# User Schemas
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)

class UserResponse(BaseModel):
    id: int
    username: str
    created_at: datetime

    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Task Schemas
class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    priority: str = Field(default="medium", pattern="^(low|medium|high)$")
    tag: Optional[str] = Field(default=None, max_length=30)
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    priority: Optional[str] = Field(None, pattern="^(low|medium|high)$")
    status: Optional[str] = Field(None, pattern="^(pending|completed)$")
    tag: Optional[str] = Field(None, max_length=30)
    due_date: Optional[datetime] = None

class TaskResponse(TaskBase):
    id: int
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    user_id: int

    class Config:
        from_attributes = True
