"""
Tables:
- Students
- Employees
- Units
- Groups
- Group_members
"""

from sqlalchemy import String, Integer, ForeignKey, \
    UniqueConstraint, Float, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from src.database.base import Base


class Students(Base):
    """Students model representing a student in the system."""
    __tablename__ = 'students'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'))
    study_field: Mapped[int] = mapped_column(Integer, ForeignKey('study_fields.id'))
    major: Mapped[int | None] = mapped_column(Integer, ForeignKey('major.id'))

    __table_args__ = (
        UniqueConstraint('user_id', 'study_field', name='uq_students_user_id'),
    )


class Employees(Base):
    """Employees model representing an employee in the system."""
    __tablename__ = 'employees'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'))
    faculty_id: Mapped[int] = mapped_column(Integer, ForeignKey('faculty.id'))
    unit_id: Mapped[int] = mapped_column(Integer, ForeignKey('units.id'))
    workload: Mapped[float] = mapped_column(Float, default=80)

    __table_args__ = (
        UniqueConstraint('user_id', 'unit_id', 'faculty_id', name='uq_employees_user_id'),
    )


class Units(Base):
    """Units model representing a unit in the system."""
    __tablename__ = 'units'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    unit_name: Mapped[str] = mapped_column(String(255), unique=True)
    faculty_id: Mapped[int] = mapped_column(Integer, ForeignKey('faculty.id'))
    unit_short: Mapped[str] = mapped_column(String(255), unique=True)


class Groups(Base):
    """Groups model representing a group in the system."""
    __tablename__ = 'groups'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    group_name: Mapped[str] = mapped_column(String(255), unique=True)
    study_field: Mapped[int] = mapped_column(Integer, ForeignKey('study_fields.id'))
    major: Mapped[int | None] = mapped_column(Integer, ForeignKey('major.id'))
    elective_block: Mapped[int | None] = mapped_column(Integer, ForeignKey(
        'elective_block.id'))  # Major and elective_block can't be set at the same time

    __table_args__ = (
        CheckConstraint(
            '(major IS NULL) OR (elective_block IS NULL)',
            name='check_major_elective_block'
        ),
    )


class Group_members(Base):
    """Group_members model representing a group member in the system."""
    __tablename__ = 'group_members'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    group: Mapped[int] = mapped_column(Integer, ForeignKey('groups.id'))
    student: Mapped[int] = mapped_column(Integer, ForeignKey('students.id'))

    __table_args__ = (
        UniqueConstraint('group', 'student', name='uq_group_members_group_id'),
    )
