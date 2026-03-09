"""
API endpoints: /api/users
"""

from typing import List, Iterable
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session
import logging

from . import models, schemas
from ..database.database import get_db

router = APIRouter(prefix="/users", tags=["users"])
logger = logging.getLogger(__name__)


def _get_or_404(db: Session, model, obj_id: int, name: str):
    obj = db.get(model, obj_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{name} not found")
    return obj

def _commit_or_rollback(db: Session):
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        detail = str(e.orig) if getattr(e, "orig", None) else str(e)
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)
    except SQLAlchemyError as e:
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
    obj = models.Users(**payload.model_dump())
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
    _apply_patch_or_reject_nulls(obj, payload, nullable_fields={"phone_number", "grade"})
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