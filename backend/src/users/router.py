import os
from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from . import models, schemas
from ..database.database import get_db
from src.common.router_utils import (
    _get_or_404,
    _commit_or_rollback,
    _apply_patch_or_reject_nulls,
)

router = APIRouter(prefix="/users", tags=["users"])
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_ctx.verify(plain_password, hashed_password)


def authenticate_user(db: Session, email: str, password: str) -> models.Users | None:
    user = db.query(models.Users).filter(models.Users.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": int(expire.replace(tzinfo=timezone.utc).timestamp())})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> models.Users:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = _get_or_404(db, models.Users, int(user_id), "User")
    return user


@router.post("/login", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


# for tests
@router.get("/me", response_model=schemas.UserRead)
def read_own_user(current_user: models.Users = Depends(get_current_user)):
    return current_user


# Roles
@router.post(
    "/roles", response_model=schemas.RoleRead, status_code=status.HTTP_201_CREATED
)
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
def update_role(
    role_id: int, payload: schemas.RoleUpdate, db: Session = Depends(get_db)
):
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
def update_user(
    user_id: int, payload: schemas.UserUpdate, db: Session = Depends(get_db)
):
    obj = _get_or_404(db, models.Users, user_id, "User")

    if "password" in payload.model_fields_set:
        if payload.password is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="`password` cannot be set to null when provided",
            )
        obj.password_hash = pwd_ctx.hash(payload.password)

    _apply_patch_or_reject_nulls(
        obj, payload, nullable_fields={"phone_number", "degree"}, exclude={"password"}
    )
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
