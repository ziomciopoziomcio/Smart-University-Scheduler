from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from src.common.pagination.pagination import paginate
from src.common.pagination.pagination_model import PaginatedResponse
from src.common.router_utils import (
    _get_or_404,
    _commit_or_rollback,
    _apply_patch_or_reject_nulls,
    serialize_employee_nested,
    build_ilike_search_filter,
)
from .. import models, schemas
from ...database.database import get_db
from ...common.require_permission import require_permission
from ...users import models as user_models
from ...facilities import models as facilities_models

router = APIRouter(tags=["academics - employees"])

EMPLOYEE_LIMIT = 100


# Employees
@router.post(
    "/employees",
    response_model=schemas.EmployeeRead,
    status_code=status.HTTP_201_CREATED,
)
def create_employee(
    payload: schemas.EmployeeCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("employee:create")),
):
    obj = models.Employees(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/employees", response_model=PaginatedResponse[schemas.EmployeeNested])
def list_employees(
    user_id: int | None = Query(None),
    faculty_id: int | None = Query(None),
    unit_id: int | None = Query(None),
    limit: int | None = Query(EMPLOYEE_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("employees:view")),
    search: str | None = Query(None),
):
    filters = []
    if user_id is not None:
        filters.append(models.Employees.user_id == user_id)
    if faculty_id is not None:
        filters.append(models.Employees.faculty_id == faculty_id)
    if unit_id is not None:
        filters.append(models.Employees.unit_id == unit_id)

    count_q = db.query(models.Employees)
    if filters:
        count_q = count_q.filter(*filters)

    joined_q = (
        db.query(
            models.Employees,
            user_models.Users,
            models.Units,
            facilities_models.Faculty,
        )
        .join(user_models.Users, models.Employees.user_id == user_models.Users.id)
        .outerjoin(models.Units, models.Employees.unit_id == models.Units.id)
        .outerjoin(
            facilities_models.Faculty,
            models.Employees.faculty_id == facilities_models.Faculty.id,
        )
    )

    trimmed_search = (search or "").strip()
    if trimmed_search:
        search_filter = build_ilike_search_filter(
            trimmed_search,
            columns=[
                user_models.Users.name,
                user_models.Users.surname,
                user_models.Users.email,
                user_models.Users.degree,
                models.Units.unit_short,
            ],
            extra_phrase_columns=[
                func.concat(user_models.Users.name, " ", user_models.Users.surname),
                func.concat(user_models.Users.surname, " ", user_models.Users.name),
            ],
        )
        if search_filter is not None:
            count_q = (
                count_q.join(
                    user_models.Users, models.Employees.user_id == user_models.Users.id
                )
                .outerjoin(models.Units, models.Employees.unit_id == models.Units.id)
                .filter(search_filter)
            )
            joined_q = joined_q.filter(search_filter)

    if filters:
        joined_q = joined_q.filter(*filters)

    paginated = paginate(
        joined_q,
        limit=limit,
        offset=offset,
        order_by=models.Employees.id,
        count_query=count_q,
    )

    rows = paginated.items
    total = paginated.total

    items = [serialize_employee_nested(row) for row in rows]
    return PaginatedResponse(items=items, total=total, limit=limit, offset=offset)


@router.get("/employees/{employee_id}", response_model=schemas.EmployeeNested)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("employee:view")),
):
    row = (
        db.query(
            models.Employees,
            user_models.Users,
            models.Units,
            facilities_models.Faculty,
        )
        .join(user_models.Users, models.Employees.user_id == user_models.Users.id)
        .outerjoin(models.Units, models.Employees.unit_id == models.Units.id)
        .outerjoin(
            facilities_models.Faculty,
            models.Employees.faculty_id == facilities_models.Faculty.id,
        )
        .filter(models.Employees.id == employee_id)
        .one_or_none()
    )
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
        )

    return serialize_employee_nested(row)


@router.patch("/employees/{employee_id}", response_model=schemas.EmployeeRead)
def update_employee(
    employee_id: int,
    payload: schemas.EmployeeUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("employee:update")),
):
    obj = _get_or_404(db, models.Employees, employee_id, "Employee")
    _apply_patch_or_reject_nulls(obj, payload)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/employees/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("employee:delete")),
):
    obj = _get_or_404(db, models.Employees, employee_id, "Employee")
    db.delete(obj)
    _commit_or_rollback(db)
    return None
