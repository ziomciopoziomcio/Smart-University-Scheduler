from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict

from .models import MessageRole


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class ChatCreate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)


class ChatRead(BaseModel):
    id: int
    user_id: int
    title: Optional[str] = None
    created_at: datetime


class MessageCreate(BaseModel):
    role: MessageRole = MessageRole.USER
    content: str = Field(..., min_length=1)


class MessageRead(BaseModel):
    id: int
    chat_id: int
    role: MessageRole
    content: str
    created_at: datetime
