from typing import Any

from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlalchemy import func, case
from sqlalchemy.orm import Session

from src.common.router_utils import (
    _get_or_404,
    _get_by_fields_or_404,
)
from . import models, schemas
from ..database.database import get_db
from ..common.require_permission import require_permission
from ..users import models as user_models
from ..courses import models as course_models
from ..facilities import models as facilities_models
from .routers import students, employees, units, groups, calendar

router = APIRouter(prefix="/academics", tags=["academics"])

router.include_router(students.router)
router.include_router(employees.router)
router.include_router(units.router)
router.include_router(groups.router)
router.include_router(calendar.router)


@router.get(
    "/semesters/summary/by-study-field/{study_field_id}",
    response_model=list[schemas.StudyFieldSemesterSummary],
)
def get_study_field_semester_summary(
    study_field_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("study-fields:view")),
):
    """Return semester-by-semester summary data for the given study field.
    The response contains one item per semester found in curriculum courses for study programs belonging to the study field.
    groups_count: number of regular groups in that semester (groups with neither major nor elective_block and with Groups.semester equal to the semester).
    specializations_count: number of distinct specializations (majors) that have at least one group in that semester.
    elective_blocks_count: number of distinct elective blocks that have at least one group in that semester.
    Counts equal to zero are returned as None for the semester-specific fields."""
    _get_or_404(db, course_models.Study_fields, study_field_id, "Study Field")

    semester_stats = _get_semester_stats_query(db, study_field_id)

    results = []
    for semester, spec_count, elec_count, base_groups_count in semester_stats:
        results.append(
            schemas.StudyFieldSemesterSummary(
                semester_number=semester,
                groups_count=base_groups_count,
                specializations_count=spec_count if spec_count > 0 else None,
                elective_blocks_count=elec_count if elec_count > 0 else None,
            )
        )
    return results


def _get_semester_stats_query(db: Session, study_field_id: int) -> list[Any]:
    return (
        db.query(
            course_models.Curriculum_course.semester,
            func.count(func.distinct(models.Groups.major)).label("spec_count"),
            func.count(func.distinct(models.Groups.elective_block)).label("elec_count"),
            func.count(
                func.distinct(
                    case(
                        (
                            (models.Groups.major.is_(None))
                            & (models.Groups.elective_block.is_(None)),
                            models.Groups.id,
                        ),
                        else_=None,
                    )
                )
            ).label("base_groups_count"),
        )
        .join(
            course_models.Study_program,
            course_models.Curriculum_course.study_program
            == course_models.Study_program.id,
        )
        .outerjoin(
            models.Groups,
            (models.Groups.study_program == course_models.Study_program.id)
            & (models.Groups.semester == course_models.Curriculum_course.semester),
        )
        .filter(course_models.Study_program.study_field == study_field_id)
        .group_by(course_models.Curriculum_course.semester)
        .order_by(course_models.Curriculum_course.semester)
        .all()
    )


@router.get(
    "/instructors/by-faculty/{faculty_id}",
    response_model=list[schemas.CourseInstructor],
)
def get_faculty_instructors(
    faculty_id: int,
    unit_id: int | None = Query(None),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("employees:view")),
):
    """
    Get list of instructors for a given faculty.
    Optional query param `unit_id` restricts results to a specific unit.
    :param faculty_id: ID of the faculty to get instructors for
    :param unit_id: optional unit id to filter instructors by unit
    :param db: Database session
    :param _current_user: Currently authenticated user
    :return: List of instructors belonging to the specified faculty (and unit if provided)
    """
    _get_or_404(db, facilities_models.Faculty, faculty_id, "Faculty")

    if unit_id is not None:
        _get_by_fields_or_404(
            db,
            models.Units,
            "Unit",
            id=unit_id,
            faculty_id=faculty_id,
        )

    q = (
        db.query(
            models.Employees.id,
            user_models.Users.name,
            user_models.Users.surname,
            user_models.Users.degree,
        )
        .join(user_models.Users, models.Employees.user_id == user_models.Users.id)
        .filter(models.Employees.faculty_id == faculty_id)
    )

    if unit_id is not None:
        q = q.filter(models.Employees.unit_id == unit_id)

    instructors = (
        q.order_by(user_models.Users.surname, user_models.Users.name).limit(1000).all()
    )

    return instructors


@router.get(
    "/instructors/{employee_id}",
    response_model=schemas.CourseInstructor,
)
def get_instructor_by_id(
    employee_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("employees:view")),
):
    """
    Get single instructor by employee id and return CourseInstructor { id, name, surname, degree }.
    """
    row = (
        db.query(models.Employees, user_models.Users)
        .join(user_models.Users, models.Employees.user_id == user_models.Users.id)
        .filter(models.Employees.id == employee_id)
        .one_or_none()
    )

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
        )

    employee, user = row
    return schemas.CourseInstructor(
        id=employee.id,
        name=user.name,
        surname=user.surname,
        degree=user.degree,
    )
