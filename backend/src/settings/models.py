from sqlalchemy import String, Integer, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column

from ..database.base import Base
from ..academics.models import SemesterType


class PlannerSettings(Base):
    """
    Per-faculty configuration for the planner and genetic algorithm.

    Each faculty has at most one settings row (enforced by `faculty_id` with
    `unique=True`). Use this table to store settings that vary between faculties.
    """

    __tablename__ = "planner_settings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    faculty_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("faculties.id"), unique=True
    )

    planned_academic_year: Mapped[str] = mapped_column(
        String(20), default="2025/2026"
    )  # TODO
    planned_semester_type: Mapped[SemesterType] = mapped_column(Enum(SemesterType))
    is_planning_active: Mapped[bool] = mapped_column(
        default=True
    )  # placeholder for communication GA <-> Frontend
