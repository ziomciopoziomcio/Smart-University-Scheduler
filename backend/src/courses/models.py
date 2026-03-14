"""
Tables:
- Study_fields
- Major
- Elective_block
- Courses
- course_type_details
- Courses instructors
"""

from sqlalchemy import String, Integer, ForeignKey, \
    UniqueConstraint, Boolean, CheckConstraint, Enum
from sqlalchemy.orm import Mapped, mapped_column
from ..database.base import Base
import enum


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
    __tablename__ = 'study_fields'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    faculty: Mapped[int] = mapped_column(Integer, ForeignKey('faculty.id'))
    field_name: Mapped[str] = mapped_column(String(255), unique=True)


class Major(Base):
    """Major model representing a major in the system."""
    __tablename__ = 'major'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    study_field: Mapped[int | None] = mapped_column(Integer, ForeignKey('study_fields.id'))
    major_name: Mapped[str] = mapped_column(String(255))


class Elective_block(Base):
    """Elective_block model representing an elective block in the system."""
    __tablename__ = 'elective_block'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    study_field: Mapped[int] = mapped_column(Integer, ForeignKey('study_fields.id'))
    elective_block_name: Mapped[str] = mapped_column(String(255))


class Courses(Base):
    """Courses model representing a course in the system."""
    __tablename__ = 'courses'

    course_code: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ects_points: Mapped[int] = mapped_column(Integer)
    course_name: Mapped[str] = mapped_column(String(255))
    course_language: Mapped[CourseLanguage] = mapped_column(
        Enum(CourseLanguage)
    )
    leading_unit: Mapped[int] = mapped_column(Integer, ForeignKey('units.id'))
    course_coordinator: Mapped[int] = mapped_column(Integer, ForeignKey('employees.id'))
    study_field: Mapped[int] = mapped_column(Integer, ForeignKey('study_fields.id'))
    major: Mapped[int | None] = mapped_column(Integer, ForeignKey('major.id'))
    elective_block: Mapped[int | None] = mapped_column(Integer, ForeignKey('elective_block.id'))

    __table_args__ = (
        CheckConstraint('(major IS NULL) OR (elective_block IS NULL)', name='chk_courses_major_elective'),
    )


class Course_type_details(Base):
    """Course_type_details model representing details of a course type in the system."""
    __tablename__ = 'course_type_details'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    course: Mapped[int] = mapped_column(Integer, ForeignKey('courses.course_code'))
    class_type: Mapped[ClassType] = mapped_column(
        Enum(ClassType)
    )
    class_hours: Mapped[int] = mapped_column(Integer, default=0)
    pc_needed: Mapped[bool] = mapped_column(default=False)
    projector_needed: Mapped[bool] = mapped_column(default=True)
    max_group_participants_number: Mapped[int] = mapped_column(Integer, default=15)

    __table_args__ = (
        UniqueConstraint('course', 'class_type', name='uq_course_class_type'),
    )


class Courses_instructors(Base):
    """Courses_instructors model representing the relationship between courses and instructors in the system."""
    __tablename__ = 'courses_instructors'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    employee: Mapped[int] = mapped_column(Integer, ForeignKey('employees.id'))
    course_type_details: Mapped[int] = mapped_column(Integer, ForeignKey('course_type_details.id'))

    hours: Mapped[int | None] = mapped_column(Integer)

    __table_args__ = (
        UniqueConstraint('course_type_details', 'employee',
                         name='uq_course_type_details_employee'),
    )
