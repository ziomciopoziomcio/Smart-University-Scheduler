from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from . import models, schemas
from ..database.database import get_db
from src.common.router_utils import (
    _get_or_404,
    _commit_or_rollback,
    _apply_patch_or_reject_nulls,
    _get_by_fields_or_404,
)
from src.common.pagination.pagination import paginate
from src.common.pagination.pagination_model import PaginatedResponse

router = APIRouter(prefix="/academics", tags=["academics"])

STUDENT_LIMIT = 100
EMPLOYEE_LIMIT = 100
UNIT_LIMIT = 100
GROUP_LIMIT = 100
GROUP_MEMBER_LIMIT = 100


# Students
@router.post(
    "/students", response_model=schemas.StudentRead, status_code=status.HTTP_201_CREATED
)
def create_student(payload: schemas.StudentCreate, db: Session = Depends(get_db)):
    obj = models.Students(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/students", response_model=PaginatedResponse[schemas.StudentRead])
def list_students(
    limit: int | None = Query(STUDENT_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(models.Students)
    return paginate(query, limit, offset, models.Students.id)


@router.get("/students/{student_id}", response_model=schemas.StudentRead)
def get_student(student_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Students, student_id, "Student")


@router.patch("/students/{student_id}", response_model=schemas.StudentRead)
def update_student(
    student_id: int, payload: schemas.StudentUpdate, db: Session = Depends(get_db)
):
    obj = _get_or_404(db, models.Students, student_id, "Student")
    _apply_patch_or_reject_nulls(obj, payload, nullable_fields={"major"})
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Students, student_id, "Student")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Employees
@router.post(
    "/employees",
    response_model=schemas.EmployeeRead,
    status_code=status.HTTP_201_CREATED,
)
def create_employee(payload: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    obj = models.Employees(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/employees", response_model=PaginatedResponse[schemas.EmployeeRead])
def list_employees(
    limit: int | None = Query(EMPLOYEE_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(models.Employees)
    return paginate(query, limit, offset, models.Employees.id)


@router.get("/employees/{employee_id}", response_model=schemas.EmployeeRead)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Employees, employee_id, "Employee")


@router.patch("/employees/{employee_id}", response_model=schemas.EmployeeRead)
def update_employee(
    employee_id: int, payload: schemas.EmployeeUpdate, db: Session = Depends(get_db)
):
    obj = _get_or_404(db, models.Employees, employee_id, "Employee")
    _apply_patch_or_reject_nulls(obj, payload)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/employees/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Employees, employee_id, "Employee")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Units
@router.post(
    "/units", response_model=schemas.UnitsRead, status_code=status.HTTP_201_CREATED
)
def create_unit(payload: schemas.UnitsCreate, db: Session = Depends(get_db)):
    obj = models.Units(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/units", response_model=PaginatedResponse[schemas.UnitsRead])
def list_units(
    limit: int | None = Query(UNIT_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(models.Units)
    return paginate(query, limit, offset, models.Units.id)


@router.get("/units/{unit_id}", response_model=schemas.UnitsRead)
def get_unit(unit_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Units, unit_id, "Unit")


@router.patch("/units/{unit_id}", response_model=schemas.UnitsRead)
def update_unit(
    unit_id: int, payload: schemas.UnitsUpdate, db: Session = Depends(get_db)
):
    obj = _get_or_404(db, models.Units, unit_id, "Unit")
    _apply_patch_or_reject_nulls(obj, payload)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/units/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_unit(unit_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Units, unit_id, "Unit")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Groups
@router.post(
    "/groups", response_model=schemas.GroupsRead, status_code=status.HTTP_201_CREATED
)
def create_group(payload: schemas.GroupsCreate, db: Session = Depends(get_db)):
    obj = models.Groups(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/groups", response_model=PaginatedResponse[schemas.GroupsRead])
def list_groups(
    limit: int | None = Query(GROUP_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(models.Groups)
    return paginate(query, limit, offset, models.Groups.id)


@router.get("/groups/{group_id}", response_model=schemas.GroupsRead)
def get_group(group_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Groups, group_id, "Group")


@router.patch("/groups/{group_id}", response_model=schemas.GroupsRead)
def update_group(
    group_id: int, payload: schemas.GroupsUpdate, db: Session = Depends(get_db)
):
    obj = _get_or_404(db, models.Groups, group_id, "Group")
    _apply_patch_or_reject_nulls(
        obj, payload, nullable_fields={"major", "elective_block"}
    )
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(group_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Groups, group_id, "Group")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Group Members
@router.post(
    "/group-members",
    response_model=schemas.GroupMembersRead,
    status_code=status.HTTP_201_CREATED,
)
def create_group_member(
    payload: schemas.GroupMembersCreate, db: Session = Depends(get_db)
):
    obj = models.Group_members(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get(
    "/group-members",
    response_model=PaginatedResponse[schemas.GroupMembersRead],
)
def list_group_members(
    limit: int | None = Query(GROUP_MEMBER_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(models.Group_members)
    return paginate(query, limit, offset, models.Group_members.id)


@router.get(
    "/group-members/{group_id}/{student_id}", response_model=schemas.GroupMembersRead
)
def get_group_member(group_id: int, student_id: int, db: Session = Depends(get_db)):
    return _get_by_fields_or_404(
        db,
        models.Group_members,
        "Group Member",
        group=group_id,
        student=student_id,
    )


@router.patch(
    "/group-members/{group_id}/{student_id}", response_model=schemas.GroupMembersRead
)
def update_group_member(
    group_id: int,
    student_id: int,
    payload: schemas.GroupMembersUpdate,
    db: Session = Depends(get_db),
):
    obj = _get_by_fields_or_404(
        db,
        models.Group_members,
        "Group Member",
        group=group_id,
        student=student_id,
    )
    _apply_patch_or_reject_nulls(obj, payload)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete(
    "/group-members/{group_id}/{student_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_group_member(group_id: int, student_id: int, db: Session = Depends(get_db)):
    obj = _get_by_fields_or_404(
        db,
        models.Group_members,
        "Group Member",
        group=group_id,
        student=student_id,
    )
    db.delete(obj)
    _commit_or_rollback(db)
    return None
