from typing import Iterable, Any
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError, MultipleResultsFound
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)


def _get_or_404(db: Session, model, obj_id: Any, name: str):
    """Return an object by ID or raise HTTP 404 if it does not exist."""
    obj = db.get(model, obj_id)
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"{name} not found"
        )
    return obj


def _get_by_fields_or_404(db: Session, model, name: str, **filters):
    """Return an object by arbitrary fields or raise HTTP 404 if it does not exist."""
    try:
        obj = db.query(model).filter_by(**filters).one_or_none()
    except MultipleResultsFound:
        logger.exception(
            "Multiple %s records found for filters that should be unique: %s",
            name,
            filters,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Multiple {name} records found for provided filters",
        )
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{name} not found",
        )
    return obj


def _commit_or_rollback(db: Session):
    """Commit the transaction or roll back and raise an HTTP error on failure."""
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        logger.exception("Integrity error during commit")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conflict: request violates database constraints",
        )
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Unexpected database error during commit")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


def _apply_patch_or_reject_nulls(
    obj, payload, nullable_fields: Iterable[str] = (), exclude: set[str] | None = None
):
    """Apply PATCH fields to an object and reject nulls for non-nullable fields."""
    provided = payload.model_dump(exclude_unset=True, exclude=exclude or set())
    nullable_set = set(nullable_fields)
    for k, v in provided.items():
        if v is None and k not in nullable_set:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"`{k}` cannot be set to null when provided",
            )
        setattr(obj, k, v)


def serialize_student_nested(row: tuple[Any, Any, Any, Any, Any]) -> dict:
    """
    Row shape expected from academics.router:
    (student, user, study_program, study_field, major_obj)

    Returns dict compatible with schemas.StudentNested:
    - user: UserRead
    - study_program_details: courses_schemas.StudyProgramRead
    - major_details: Optional[courses_schemas.MajorRead]
    """
    student, user, study_program, study_field, major_obj = row

    user_obj = {
        "id": user.id,
        "name": user.name,
        "surname": user.surname,
        "email": user.email,
        "degree": user.degree,
        "created_at": user.created_at,
    }

    study_program_details = {
        "id": study_program.id,
        "study_field": study_program.study_field,
        "start_year": study_program.start_year,
        "program_name": study_program.program_name
        or getattr(study_field, "field_name", None),
    }

    major_details = None
    if major_obj is not None:
        major_details = {"id": major_obj.id, "major_name": major_obj.major_name}

    return {
        "id": student.id,
        "user_id": student.user_id,
        "study_program": student.study_program,
        "major": student.major,
        "user": user_obj,
        "study_program_details": study_program_details,
        "major_details": major_details,
    }


def serialize_employee_nested(row: tuple[Any, Any, Any, Any]) -> dict:
    """
    Row shape expected from academics.router:
    (emp, user, unit, faculty)

    Returns dict compatible with schemas.EmployeeNested:
    - user: UserRead
    - unit: Optional[UnitsRead]
    - faculty: Optional[facilities_schemas.FacultyRead]
    """
    emp, user, unit, faculty = row

    user_obj = {
        "id": user.id,
        "name": user.name,
        "surname": user.surname,
        "email": user.email,
        "degree": user.degree,
        "created_at": user.created_at,
    }

    unit_obj = None
    if unit is not None:
        unit_obj = {
            "id": unit.id,
            "unit_name": unit.unit_name,
            "unit_short": unit.unit_short,
            "faculty_id": unit.faculty_id,
        }

    faculty_obj = None
    if faculty is not None:
        faculty_obj = {
            "id": faculty.id,
            "faculty_name": faculty.faculty_name,
            "faculty_short": faculty.faculty_short,
        }

    return {
        "id": emp.id,
        "user": user_obj,
        "unit": unit_obj,
        "faculty": faculty_obj,
        "faculty_id": emp.faculty_id,
        "user_id": emp.user_id,
        "unit_id": emp.unit_id,
    }
