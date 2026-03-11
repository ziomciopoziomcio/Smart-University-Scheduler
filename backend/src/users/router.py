from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from . import models, schemas
from ..database.database import get_db
from src.common.router_utils import _get_or_404, _commit_or_rollback, _apply_patch_or_reject_nulls

router = APIRouter(prefix="/users", tags=["users"])
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Roles
@router.post("/roles", response_model=schemas.RoleRead, status_code=status.HTTP_201_CREATED)
def create_role(payload: schemas.RoleCreate, db: Session = Depends(get_db)):
    obj = models.Roles(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj

@router.get("/roles", response_model=List[schemas.RoleRead])
def list_roles(db: Session = Depends(get_db)):
    return db.query(models.Roles).all()

@router.get("/roles/{role_id}", response_model=schemas.RoleRead)
def get_role(role_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Roles, role_id, "Role")

@router.patch("/roles/{role_id}", response_model=schemas.RoleRead)
def update_role(role_id: int, payload: schemas.RoleUpdate, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Roles, role_id, "Role")
    _apply_patch_or_reject_nulls(obj, payload)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj

@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(role_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Roles, role_id, "Role")
    db.delete(obj)
    _commit_or_rollback(db)
    return None

# Users
@router.post("/", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
def create_user(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    data = payload.model_dump()
    data["password_hash"] = pwd_ctx.hash(data.pop("password"))
    obj = models.Users(**data)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj

@router.get("/", response_model=List[schemas.UserRead])
def list_users(db: Session = Depends(get_db)):
    return db.query(models.Users).all()

@router.get("/{user_id}", response_model=schemas.UserRead)
def get_user(user_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Users, user_id, "User")


@router.patch("/{user_id}", response_model=schemas.UserRead)
def update_user(user_id: int, payload: schemas.UserUpdate, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Users, user_id, "User")

    if "password" in payload.model_fields_set:
        if payload.password is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="`password` cannot be set to null when provided"
            )
        obj.password_hash = pwd_ctx.hash(payload.password)

    _apply_patch_or_reject_nulls(obj, payload, nullable_fields={"phone_number", "grade"}, exclude={"password"})
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Users, user_id, "User")
    db.delete(obj)
    _commit_or_rollback(db)
    return None