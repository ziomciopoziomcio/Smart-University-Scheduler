from typing import List, Iterable
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session
import logging

from . import models, schemas
from ..database.database import get_db

router = APIRouter(prefix="/academics", tags=["academics"])
logger = logging.getLogger(__name__)

def _get_or_404(db: Session, model, obj_id: int, name: str):
    obj = db.get(model, obj_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{name} not found")
    return obj

def _commit_or_rollback(db: Session):
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        logger.exception("Integrity error during commit")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Conflict: request violates database constraints")
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Unexpected database error during commit")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

def _apply_patch_or_reject_nulls(obj, payload, nullable_fields: Iterable[str] = ()):
    provided = payload.model_dump(exclude_unset=True)
    nullable_set = set(nullable_fields)
    for k, v in provided.items():
        if v is None and k not in nullable_set:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"`{k}` cannot be set to null when provided"
            )
        setattr(obj, k, v)

# Students
@router.post("/students", response_model=schemas.StudentRead, status_code=status.HTTP_201_CREATED)
def create_student(payload: schemas.StudentCreate, db: Session = Depends(get_db)):
    obj = models.Students(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj

@router.get("/students", response_model=List[schemas.StudentRead])
def list_students(db: Session = Depends(get_db)):
    return db.query(models.Students).all()

@router.get("/students/{student_id}", response_model=schemas.StudentRead)
def get_student(student_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Students, student_id, "Student")

@router.patch("/students/{student_id}", response_model=schemas.StudentRead)
def update_student(student_id: int, payload: schemas.StudentUpdate, db: Session = Depends(get_db)):
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
@router.post("/employees", response_model=schemas.EmployeeRead, status_code=status.HTTP_201_CREATED)
def create_employee(payload: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    obj = models.Employees(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj

@router.get("/employees", response_model=List[schemas.EmployeeRead])
def list_employees(db: Session = Depends(get_db)):
    return db.query(models.Employees).all()

@router.get("/employees/{employee_id}", response_model=schemas.EmployeeRead)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Employees, employee_id, "Employee")

@router.patch("/employees/{employee_id}", response_model=schemas.EmployeeRead)
def update_employee(employee_id: int, payload: schemas.EmployeeUpdate, db: Session = Depends(get_db)):
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
@router.post("/units", response_model=schemas.UnitsRead, status_code=status.HTTP_201_CREATED)
def create_unit(payload: schemas.UnitsCreate, db: Session = Depends(get_db)):
    obj = models.Units(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj

@router.get("/units", response_model=List[schemas.UnitsRead])
def list_units(db: Session = Depends(get_db)):
    return db.query(models.Units).all()

@router.get("/units/{unit_id}", response_model=schemas.UnitsRead)
def get_unit(unit_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Units, unit_id, "Unit")

@router.patch("/units/{unit_id}", response_model=schemas.UnitsRead)
def update_unit(unit_id: int, payload: schemas.UnitsUpdate, db: Session = Depends(get_db)):
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
@router.post("/groups", response_model=schemas.GroupsRead, status_code=status.HTTP_201_CREATED)
def create_group(payload: schemas.GroupsCreate, db: Session = Depends(get_db)):
    obj = models.Groups(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj

@router.get("/groups", response_model=List[schemas.GroupsRead])
def list_groups(db: Session = Depends(get_db)):
    return db.query(models.Groups).all()

@router.get("/groups/{group_id}", response_model=schemas.GroupsRead)
def get_group(group_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Groups, group_id, "Group")

@router.patch("/groups/{group_id}", response_model=schemas.GroupsRead)
def update_group(group_id: int, payload: schemas.GroupsUpdate, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Groups, group_id, "Group")
    _apply_patch_or_reject_nulls(obj, payload, nullable_fields={"major", "elective_block"})
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
@router.post("/group-members", response_model=schemas.GroupMembersRead, status_code=status.HTTP_201_CREATED)
def create_group_member(payload: schemas.GroupMembersCreate, db: Session = Depends(get_db)):
    obj = models.Group_members(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj

@router.get("/group-members", response_model=List[schemas.GroupMembersRead])
def list_group_members(db: Session = Depends(get_db)):
    return db.query(models.Group_members).all()

@router.get("/group-members/{group_member_id}", response_model=schemas.GroupMembersRead)
def get_group_member(group_member_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Group_members, group_member_id, "Group Member")

@router.patch("/group-members/{group_member_id}", response_model=schemas.GroupMembersRead)
def update_group_member(group_member_id: int, payload: schemas.GroupMembersUpdate, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Group_members, group_member_id, "Group Member")
    _apply_patch_or_reject_nulls(obj, payload)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/group-members/{group_member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group_member(group_member_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Group_members, group_member_id, "Group Member")
    db.delete(obj)
    _commit_or_rollback(db)
    return None
