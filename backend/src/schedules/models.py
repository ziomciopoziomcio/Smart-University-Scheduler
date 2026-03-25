import enum
import uuid
from datetime import date, datetime

from sqlalchemy import (
    DateTime,
    Integer,
    ForeignKey,
    String,
    Enum,
    JSON,
    Uuid,
    CheckConstraint,
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

    __tablename__ = "schedule_suggestions"

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


class AbsenceStatus(str, enum.Enum):
    REPORTED = "REPORTED"
    PROCESSING = "PROCESSING"
    SUBSTITUTED = "SUBSTITUTED"
    RESCHEDULED = "RESCHEDULED"
    FAILED = "FAILED"


class Employee_absences(Base):
    __tablename__ = "employee_absences"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    event_id: Mapped[uuid.UUID] = mapped_column(
        default=uuid.uuid4, unique=True, index=True
    )

    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id"))

    start_date: Mapped[date] = mapped_column()
    end_date: Mapped[date] = mapped_column()
    reason: Mapped[str | None] = mapped_column(String(255))

    status: Mapped[AbsenceStatus] = mapped_column(
        Enum(AbsenceStatus), default=AbsenceStatus.REPORTED
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )

    __table_args__ = (
        CheckConstraint("start_date <= end_date", name="chk_employee_absences_dates"),
    )
