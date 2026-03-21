"""
Tables:
- messages
- chats
"""

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Integer,
    ForeignKey,
    Text,
    DateTime,
    Boolean,
)
from sqlalchemy.orm import Mapped, mapped_column
from ..database.base import Base


class MessageRole(str, enum.Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class Chats(Base):
    __tablename__ = "chats"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    visible: Mapped[bool] = mapped_column(Boolean, default=True)
    title: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
