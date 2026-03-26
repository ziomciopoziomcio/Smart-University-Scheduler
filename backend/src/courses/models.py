"""
Tables:
- Study_fields
- Major
- Elective_block
- Course
- course_type_detail
- Courses instructors
"""

import enum

from sqlalchemy import (
    String,
    Integer,
    ForeignKey,
    ForeignKeyConstraint,
    CheckConstraint,
    Enum,
)
from sqlalchemy.orm import Mapped, mapped_column

from ..database.base import Base


class CourseLanguage(str, enum.Enum):
    POLISH = "Polish"
    ENGLISH = "English"
    FRENCH = "French"


class ClassType(str, enum.Enum):
    LECTURE = "Lecture"
    TUTORIALS = "Tutorials"
    LABORATORY = "Laboratory"
    SEMINAR = "Seminar"
    OTHER = "Other"
    ELEARNING = "E-learning"


class Study_fields(Base):
    """Study_fields model representing a study field in the system."""

    __tablename__ = "study_fields"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    faculty: Mapped[int] = mapped_column(Integer, ForeignKey("faculties.id"))
    field_name: Mapped[str] = mapped_column(String(255), unique=True)


class Major(Base):
    """Major model representing a major in the system."""

    __tablename__ = "major"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    study_field: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("study_fields.id")
    )
    major_name: Mapped[str] = mapped_column(String(255))


class Elective_block(Base):
    """Elective_block model representing an elective block in the system."""

    __tablename__ = "elective_block"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    study_field: Mapped[int] = mapped_column(Integer, ForeignKey("study_fields.id"))
    elective_block_name: Mapped[str] = mapped_column(String(255))


class Course(Base):
    """Courses model representing a course in the system."""

    __tablename__ = "courses"

    course_code: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ects_points: Mapped[int] = mapped_column(Integer)
    course_name: Mapped[str] = mapped_column(String(255))
    course_language: Mapped[CourseLanguage] = mapped_column(Enum(CourseLanguage))
    leading_unit: Mapped[int] = mapped_column(Integer, ForeignKey("units.id"))
    course_coordinator: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id"))


class Study_program(Base):
    """Study_programs model representing a specific curriculum cycle"""

    __tablename__ = "study_programs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    study_field: Mapped[int] = mapped_column(Integer, ForeignKey("study_fields.id"))
    start_year: Mapped[str] = mapped_column(String(20))
    program_name: Mapped[str | None] = mapped_column(String(255))


class Curriculum_course(Base):
    """Curriculum_courses model representing a course placement in a specific study program."""

    __tablename__ = "curriculum_courses"

    study_program: Mapped[int] = mapped_column(
        Integer, ForeignKey("study_programs.id"), primary_key=True
    )
    course: Mapped[int] = mapped_column(
        Integer, ForeignKey("courses.course_code"), primary_key=True
    )

    semester: Mapped[int] = mapped_column(Integer, primary_key=True)

    major: Mapped[int | None] = mapped_column(Integer, ForeignKey("major.id"))
    elective_block: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("elective_block.id")
    )

    __table_args__ = (
        CheckConstraint(
            "(major IS NULL) OR (elective_block IS NULL)",
            name="chk_courses_major_elective",
        ),
    )


class Course_type_detail(Base):
    """Course_type_detail model representing details of a course type in the system."""

    __tablename__ = "course_type_detail"

    course: Mapped[int] = mapped_column(
        Integer, ForeignKey("courses.course_code"), primary_key=True
    )
    class_type: Mapped[ClassType] = mapped_column(Enum(ClassType), primary_key=True)
    class_hours: Mapped[int] = mapped_column(Integer, default=0)
    pc_needed: Mapped[bool] = mapped_column(default=False)
    projector_needed: Mapped[bool] = mapped_column(default=True)
    max_group_participants_number: Mapped[int] = mapped_column(Integer, default=15)


class Courses_instructors(Base):
    """Courses_instructors model representing the relationship between courses and instructors in the system."""

    __tablename__ = "courses_instructors"

    employee: Mapped[int] = mapped_column(
        Integer, ForeignKey("employees.id"), primary_key=True
    )
    course: Mapped[int] = mapped_column(Integer, primary_key=True)
    class_type: Mapped[ClassType] = mapped_column(Enum(ClassType), primary_key=True)
    hours: Mapped[int] = mapped_column(Integer, default=0)

    __table_args__ = (
        ForeignKeyConstraint(
            ["course", "class_type"],
            ["course_type_detail.course", "course_type_detail.class_type"],
            name="fk_courses_instructors_course_type_detail",
        ),
    )
