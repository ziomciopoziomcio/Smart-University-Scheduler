from typing import Iterable, Any
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError, MultipleResultsFound
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
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


def _build_phrase_condition(
    phrase_pattern: str, columns: list, extra_phrase_columns: list | None = None
) -> Any:
    """
    Return OR(...) over all columns and optional extra_phrase_columns using ilike(phrase_pattern).
    """
    targets: list = list(columns)
    if extra_phrase_columns:
        targets.extend(extra_phrase_columns)
    return or_(*[c.ilike(phrase_pattern) for c in targets])


def _build_tokens_condition(tokens: list[str], columns: list) -> Any | None:
    """
    Build AND( OR(col ilike %token%) for each token ). Returns None if tokens length <= 1.
    """
    if len(tokens) <= 1:
        return None
    per_token = [or_(*[c.ilike(f"%{tok}%") for c in columns]) for tok in tokens]
    return and_(*per_token)


def build_ilike_search_filter(
    search: str,
    columns: list,
    *,
    extra_phrase_columns: list | None = None,
):
    """
    Build an SQLAlchemy boolean filter for case-insensitive substring search across multiple columns.

    Behavior:
    - Performs full-phrase ILIKE matching (ILIKE '%search%') against provided columns and
      optional extra phrase expressions.
    - If the search contains multiple whitespace-separated tokens, also requires each token
      to appear somewhere among `columns` (AND of per-token ORs).
    - Returns a single SQLAlchemy boolean expression usable in `Query.filter(...)`, or None
      when the trimmed search string is empty.

    :param search: str - raw user-provided search string (will be trimmed). If empty, function returns None.
    :param columns: list - sequence of SQLAlchemy column/expression objects to search (e.g. User.name).
    :param extra_phrase_columns: list | None - optional expressions used only for full-phrase matching
        (e.g. func.concat(User.name, " ", User.surname)).
    :returns: SQLAlchemy boolean expression or None - an expression suitable for `Query.filter(...)`,
        or None when `search` is empty.
    """
    s = (search or "").strip()
    if not s:
        return None

    tokens = [t for t in s.split() if t]
    phrase_pattern = f"%{s}%"

    phrase_cond = _build_phrase_condition(phrase_pattern, columns, extra_phrase_columns)
    tokens_cond = _build_tokens_condition(tokens, columns)

    return phrase_cond if tokens_cond is None else or_(phrase_cond, tokens_cond)


def apply_filters_to_queries(query, count_query, filters: Iterable):
    """
    Apply provided SQLAlchemy filter expressions to both query and count_query.

    :param query: the main SQLAlchemy query (selecting rows)
    :param count_query: the SQLAlchemy count query used to compute total
    :param filters: iterable of SQLAlchemy filter expressions (or None)
    :returns: tuple (query, count_query) with filters applied
    """
    for f in filters:
        if f is not None:
            query = query.filter(f)
            count_query = count_query.filter(f)
    return query, count_query


def apply_search_to_queries(
    search: str | None,
    query,
    count_query,
    columns: list,
    *,
    extra_phrase_columns: list | None = None,
):
    """
    Build the ilike-based search condition (using build_ilike_search_filter)
    and apply it to both query and count_query.

    :param search: search string (can be None)
    :param query: main SQLAlchemy query
    :param count_query: count query to keep total consistent
    :param columns: list of columns used for token matching
    :param extra_phrase_columns: optional list of columns used only for phrase match
    :returns: tuple (query, count_query) with search filter applied (if any)
    """
    normalized_search = (search or "").strip()
    if not normalized_search:
        return query, count_query

    f = build_ilike_search_filter(
        normalized_search, columns=columns, extra_phrase_columns=extra_phrase_columns
    )
    if f is not None:
        query = query.filter(f)
        count_query = count_query.filter(f)
    return query, count_query


def parse_csv_param(param: str | None) -> list[str] | None:
    """
    Parse a CSV parameter string and return a list of the parsed values.
    :param param: the raw CSV parameter string (e.g. "1,2,3" or "a,b,c"). Can be None or empty, in which case None is returned.
    :return: a list of parsed values (e.g. ["1", "2", "3"] or ["a", "b", "c"]), or None if the input is None or empty.
    """
    if not param:
        return None
    return [p.strip() for p in param.split(",") if p.strip()]
