import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    String,
    Enum,
    JSON,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from ..database.base import Base


class SuggestionStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    FAILED = "FAILED"


class ScheduleSuggestion(Base):
    """ScheduleSuggestion model representing a schedule suggestion in the system."""

    __tablename__ = "schedule_suggestion"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    source: Mapped[str] = mapped_column(String(50))
    reason: Mapped[str] = mapped_column(String(255))
    target_class_session_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), index=True
    )

    state_before: Mapped[dict] = mapped_column(JSON)
    state_after: Mapped[dict] = mapped_column(JSON)

    status: Mapped[SuggestionStatus] = mapped_column(
        Enum(SuggestionStatus), default=SuggestionStatus.PENDING
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
