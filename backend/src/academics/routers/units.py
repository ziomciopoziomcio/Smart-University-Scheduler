from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from src.common.pagination.pagination import paginate
from src.common.pagination.pagination_model import PaginatedResponse
from src.common.router_utils import (
    _get_or_404,
    _commit_or_rollback,
    _apply_patch_or_reject_nulls,
    apply_search_to_queries,
)
from .. import models, schemas
from ...database.database import get_db
from ...common.require_permission import require_permission
from ...users import models as user_models
from ...courses import models as course_models

router = APIRouter(tags=["academics - units"])

UNIT_LIMIT = 100


# Units
@router.post(
    "/units", response_model=schemas.UnitsRead, status_code=status.HTTP_201_CREATED
)
def create_unit(
    payload: schemas.UnitsCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("unit:create")),
):
    obj = models.Units(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


def _build_units_query(
    db: Session,
    faculty_id: int | None,
    unit_name: str | None,
    unit_short: str | None,
    search: str | None,
):
    lecturers_subq = (
        db.query(func.count(models.Employees.id))
        .filter(models.Employees.unit_id == models.Units.id)
        .scalar_subquery()
    )
    courses_subq = (
        db.query(func.count(course_models.Course.course_code))
        .filter(course_models.Course.leading_unit == models.Units.id)
        .scalar_subquery()
    )

    query = db.query(
        models.Units,
        func.coalesce(lecturers_subq, 0).label("lecturers_count"),
        func.coalesce(courses_subq, 0).label("courses_count"),
    )
    count_query = db.query(models.Units.id)

    filters = []
    if faculty_id is not None:
        filters.append(models.Units.faculty_id == faculty_id)
    if unit_name:
        filters.append(models.Units.unit_name.ilike(f"%{unit_name}%"))
    if unit_short:
        filters.append(models.Units.unit_short.ilike(f"%{unit_short}%"))

    if filters:
        query = query.filter(*filters)
        count_query = count_query.filter(*filters)

    return apply_search_to_queries(
        search=search,
        query=query,
        count_query=count_query,
        columns=[models.Units.unit_name, models.Units.unit_short],
    )


@router.get("/units", response_model=PaginatedResponse[schemas.UnitsReadWithCount])
def list_units(
    faculty_id: int | None = Query(None),
    unit_name: str | None = Query(None, min_length=1),
    unit_short: str | None = Query(None, min_length=1),
    limit: int | None = Query(UNIT_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("units:view")),
    search: str | None = Query(None),
):
    query, count_query = _build_units_query(
        db, faculty_id, unit_name, unit_short, search
    )

    pagination_result = paginate(
        query, limit, offset, order_by=models.Units.id, count_query=count_query
    )

    pagination_result.items = [
        schemas.UnitsReadWithCount(
            id=row.Units.id,
            unit_name=row.Units.unit_name,
            unit_short=row.Units.unit_short,
            faculty_id=row.Units.faculty_id,
            lecturers_count=row.lecturers_count,
            courses_count=row.courses_count,
        )
        for row in pagination_result.items
    ]

    return pagination_result


@router.get("/units/{unit_id}", response_model=schemas.UnitsReadWithCount)
def get_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("unit:view")),
):
    lecturers_subq = (
        db.query(func.count(models.Employees.id))
        .filter(models.Employees.unit_id == models.Units.id)
        .scalar_subquery()
    )

    courses_subq = (
        db.query(func.count(course_models.Course.course_code))
        .filter(course_models.Course.leading_unit == models.Units.id)
        .scalar_subquery()
    )

    row = (
        db.query(
            models.Units,
            func.coalesce(lecturers_subq, 0).label("lecturers_count"),
            func.coalesce(courses_subq, 0).label("courses_count"),
        )
        .filter(models.Units.id == unit_id)
        .one_or_none()
    )

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unit with id {unit_id} not found",
        )

    return schemas.UnitsReadWithCount(
        id=row.Units.id,
        unit_name=row.Units.unit_name,
        unit_short=row.Units.unit_short,
        faculty_id=row.Units.faculty_id,
        lecturers_count=row.lecturers_count,
        courses_count=row.courses_count,
    )


@router.patch("/units/{unit_id}", response_model=schemas.UnitsRead)
def update_unit(
    unit_id: int,
    payload: schemas.UnitsUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("unit:update")),
):
    obj = _get_or_404(db, models.Units, unit_id, "Unit")
    _apply_patch_or_reject_nulls(obj, payload)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/units/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("unit:delete")),
):
    obj = _get_or_404(db, models.Units, unit_id, "Unit")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


@router.get(
    "/units/{unit_id}/instructors",
    response_model=PaginatedResponse[schemas.UnitInstructorRead],
)
def list_unit_instructors(
    unit_id: int,
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("units:view")),
):
    _get_or_404(db, models.Units, unit_id, "Unit")
    query = (
        db.query(
            models.Employees.id,
            user_models.Users.name,
            user_models.Users.surname,
            user_models.Users.degree,
        )
        .join(user_models.Users, models.Employees.user_id == user_models.Users.id)
        .filter(models.Employees.unit_id == unit_id)
    )

    count_query = db.query(models.Employees.id).filter(
        models.Employees.unit_id == unit_id
    )

    pagination_result = paginate(
        query,
        limit,
        offset,
        order_by=user_models.Users.surname,
        count_query=count_query,
    )

    pagination_result.items = [
        schemas.UnitInstructorRead(
            id=emp.id,
            name=emp.user.name,
            surname=emp.user.surname,
            degree=emp.user.degree,
        )
        for emp in pagination_result.items
    ]

    return pagination_result
