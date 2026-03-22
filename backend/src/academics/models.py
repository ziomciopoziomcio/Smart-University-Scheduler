"""
Tables:
- Students
- Employees
- Units
- Groups
- Group_members
"""

import enum
from datetime import date

from sqlalchemy import (
    String,
    Integer,
    ForeignKey,
    UniqueConstraint,
    CheckConstraint,
    Enum,
)
from sqlalchemy.orm import Mapped, mapped_column

from ..database.base import Base


class Students(Base):
    """Students model representing a student in the system."""

    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    study_program: Mapped[int] = mapped_column(Integer, ForeignKey("study_programs.id"))
    major: Mapped[int | None] = mapped_column(Integer, ForeignKey("major.id"))

    __table_args__ = (
        UniqueConstraint("user_id", "study_program", name="uq_students_user_id"),
    )


class Employees(Base):
    """Employees model representing an employee in the system."""

    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    faculty_id: Mapped[int] = mapped_column(Integer, ForeignKey("faculties.id"))
    unit_id: Mapped[int] = mapped_column(Integer, ForeignKey("units.id"))

    __table_args__ = (
        UniqueConstraint(
            "user_id", "unit_id", "faculty_id", name="uq_employees_user_id"
        ),
    )


class Units(Base):
    """Units model representing a unit in the system."""

    __tablename__ = "units"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    unit_name: Mapped[str] = mapped_column(String(255), unique=True)
    faculty_id: Mapped[int] = mapped_column(Integer, ForeignKey("faculties.id"))
    unit_short: Mapped[str] = mapped_column(String(255), unique=True)


class Groups(Base):
    """Groups model representing a group in the system."""

    __tablename__ = "groups"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    group_name: Mapped[str] = mapped_column(String(255), unique=True)
    study_program: Mapped[int] = mapped_column(Integer, ForeignKey("study_programs.id"))
    major: Mapped[int | None] = mapped_column(Integer, ForeignKey("major.id"))
    elective_block: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("elective_block.id")
    )  # Major and elective_block can't be set at the same time

    __table_args__ = (
        CheckConstraint(
            "(major IS NULL) OR (elective_block IS NULL)",
            name="check_major_elective_block",
        ),
    )


class Group_members(Base):
    """Group_members model representing a group member in the system."""

    __tablename__ = "group_members"

    group: Mapped[int] = mapped_column(
        Integer, ForeignKey("groups.id"), primary_key=True
    )
    student: Mapped[int] = mapped_column(
        Integer, ForeignKey("students.id"), primary_key=True
    )


class SemesterType(str, enum.Enum):
    """Semester type enum"""

    WINTER = "Winter"
    SUMMER = "Summer"


class Academic_calendar(Base):
    """
    Academic_calendar model representing a calendar in the system.
    """

    __tablename__ = "academic_calendar"

    calendar_date: Mapped[date] = mapped_column(primary_key=True)
    academic_year: Mapped[str] = mapped_column(String(20))
    semester_type: Mapped[SemesterType] = mapped_column(Enum(SemesterType))
    week_number: Mapped[int] = mapped_column(Integer)
    academic_day_of_week: Mapped[int] = mapped_column(Integer)
    description: Mapped[str | None] = mapped_column(String(255))

    __table_args__ = (
        UniqueConstraint(
            "academic_year",
            "semester_type",
            "week_number",
            "academic_day_of_week",
            name="uq_academic_calendar_week_day",
        ),
        CheckConstraint(
            "week_number >= 1 AND week_number <= 20",  # TODO: Make it dynamic (Planner settings)
            name="chk_academic_calendar_week_number",
        ),
        CheckConstraint(
            "academic_day_of_week >= 1 AND academic_day_of_week <= 7",
            name="chk_academic_calendar_day_of_week",
        ),
    )
