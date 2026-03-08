from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from . import models, schemas
from src.database.database import get_db

router = APIRouter(prefix="/academics", tags=["academics"])

def _get_or_404(db: Session, model, obj_id: int, name: str):
    obj = db.query(model).filter(model.id == obj_id).first()
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{name} not found")
    return obj

# Students
@router.post("/students", response_model=schemas.StudentRead, status_code=status.HTTP_201_CREATED)
def create_student(payload: schemas.StudentCreate, db: Session = Depends(get_db)):
    obj = models.Students(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return schemas.StudentRead.from_orm(obj)

@router.get("/students", response_model=List[schemas.StudentRead])
def list_students(db: Session = Depends(get_db)):
    return [schemas.StudentRead.from_orm(x) for x in db.query(models.Students).all()]

@router.get("/students/{student_id}", response_model=List[schemas.StudentRead])
def get_student(student_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Students, student_id, "Student")
    return schemas.StudentRead.from_orm(obj)

@router.patch("/students/{student_id}", response_model=schemas.StudentRead)
def update_student(student_id: int, payload: schemas.StudentUpdate, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Students, student_id, "Student")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return schemas.StudentRead.from_orm(obj)

@router.delete("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Students, student_id, "Student")
    db.delete(obj)
    db.commit()
    return None

# Employees
@router.post("/employees", response_model=schemas.EmployeeRead, status_code=status.HTTP_201_CREATED)
def create_employee(payload: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    obj = models.Employees(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return schemas.EmployeeRead.from_orm(obj)

@router.get("/employees", response_model=List[schemas.EmployeeRead])
def list_employees(db: Session = Depends(get_db)):
    return [schemas.EmployeeRead.from_orm(x) for x in db.query(models.Employees).all()]

@router.get("/employees/{employee_id}", response_model=List[schemas.EmployeeRead])
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Employees, employee_id, "Employee")
    return schemas.EmployeeRead.from_orm(obj)

@router.patch("/employees/{employee_id}", response_model=schemas.EmployeeRead)
def update_employee(employee_id: int, payload: schemas.EmployeeUpdate, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Employees, employee_id, "Employee")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return schemas.EmployeeRead.from_orm(obj)

@router.delete("/employees/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Employees, employee_id, "Employee")
    db.delete(obj)
    db.commit()
    return None

# Units
@router.post("/units", response_model=schemas.UnitsRead, status_code=status.HTTP_201_CREATED)
def create_unit(payload: schemas.UnitsCreate, db: Session = Depends(get_db)):
    obj = models.Units(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return schemas.UnitsRead.from_orm(obj)

@router.get("/units", response_model=List[schemas.UnitsRead])
def list_units(db: Session = Depends(get_db)):
    return [schemas.UnitsRead.from_orm(x) for x in db.query(models.Units).all()]

@router.get("/units/{unit_id}", response_model=schemas.UnitsRead)
def get_unit(unit_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Units, unit_id, "Unit")
    return schemas.UnitsRead.from_orm(obj)

@router.patch("/units/{unit_id}", response_model=schemas.UnitsRead)
def update_unit(unit_id: int, payload: schemas.UnitsUpdate, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Units, unit_id, "Unit")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return schemas.UnitsRead.from_orm(obj)

@router.delete("/units/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_unit(unit_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Units, unit_id, "Unit")
    db.delete(obj)
    db.commit()
    return None

# Groups
@router.post("/groups", response_model=schemas.GroupsRead, status_code=status.HTTP_201_CREATED)
def create_group(payload: schemas.GroupsCreate, db: Session = Depends(get_db)):
    obj = models.Groups(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return schemas.GroupsRead.from_orm(obj)

@router.get("/groups", response_model=List[schemas.GroupsRead])
def list_groups(db: Session = Depends(get_db)):
    return [schemas.GroupsRead.from_orm(x) for x in db.query(models.Groups).all()]

@router.get("/groups/{group_id}", response_model=schemas.GroupsRead)
def get_group(group_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Groups, group_id, "Group")
    return schemas.GroupsRead.from_orm(obj)

@router.patch("/groups/{group_id}", response_model=schemas.GroupsRead)
def update_group(group_id: int, payload: schemas.GroupsUpdate, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Groups, group_id, "Group")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return schemas.GroupsRead.from_orm(obj)

@router.delete("/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(group_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Groups, group_id, "Group")
    db.delete(obj)
    db.commit()
    return None

# Group Members
@router.post("/group-members", response_model=schemas.GroupMembersRead, status_code=status.HTTP_201_CREATED)
def create_group_member(payload: schemas.GroupMembersCreate, db: Session = Depends(get_db)):
    obj = models.GroupMembers(**payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return schemas.GroupMembersRead.from_orm(obj)

@router.get("/group-members", response_model=List[schemas.GroupMembersRead])
def list_group_members(db: Session = Depends(get_db)):
    return [schemas.GroupMembersRead.from_orm(x) for x in db.query(models.GroupMembers).all()]

@router.get("/group-members/{group_member_id}", response_model=schemas.GroupMembersRead)
def get_group_member(group_member_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.GroupMembers, group_member_id, "Group Member")
    return schemas.GroupMembersRead.from_orm(obj)

@router.patch("/group-members/{group_member_id}", response_model=schemas.GroupMembersRead)
def update_group_member(group_member_id: int, payload: schemas.GroupMembersUpdate, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.GroupMembers, group_member_id, "Group Member")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return schemas.GroupMembersRead.from_orm(obj)


@router.delete("/group-members/{group_member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group_member(group_member_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.GroupMembers, group_member_id, "Group Member")
    db.delete(obj)
    db.commit()
    return None
