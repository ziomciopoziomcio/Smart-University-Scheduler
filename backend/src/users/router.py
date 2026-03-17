import os
from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from passlib.context import CryptContext

import pyotp
import secrets
import hashlib
import json
import logging


from . import models, schemas
from ..database.database import get_db
from src.common.router_utils import (
    _get_or_404,
    _commit_or_rollback,
    _apply_patch_or_reject_nulls,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["users"])
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
ALGORITHM = "HS256"
_raw_access_token_expire = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
try:
    ACCESS_TOKEN_EXPIRE_MINUTES = int(_raw_access_token_expire)
except ValueError:
    logger.error(
        "Invalid ACCESS_TOKEN_EXPIRE_MINUTES value %r; falling back to default of 60 minutes",
        _raw_access_token_expire,
    )
    ACCESS_TOKEN_EXPIRE_MINUTES = 60

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
    expire = datetime.now(timezone.utc) + (
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
        if payload.get("pre_2fa"):
            raise credentials_exception
        if user_id is None:
            raise credentials_exception
        user_id_int = int(user_id)
    except (JWTError, ValueError, TypeError):
        raise credentials_exception

    user = db.query(models.Users).filter(models.Users.id == user_id_int).first()
    if user is None:
        raise credentials_exception
    return user


def create_pre_auth_token(user_id: int, expires_minutes: int = 5) -> str:
    data = {"sub": str(user_id), "pre_2fa": True}
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    data.update({"exp": int(expire.replace(tzinfo=timezone.utc).timestamp())})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)


def _generate_backup_codes(n: int = 8, length: int = 10) -> list[str]:
    codes: list[str] = []
    for _ in range(n):
        codes.append(secrets.token_urlsafe(length)[:length])
    return codes


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


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

    if getattr(user, "two_factor_enabled", False):
        pre_token = create_pre_auth_token(user.id)
        return {"access_token": pre_token, "token_type": "bearer", "requires_2fa": True}

    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer", "requires_2fa": False}


# for tests
@router.get("/me", response_model=schemas.UserRead)
def read_own_user(current_user: models.Users = Depends(get_current_user)):
    return current_user


@router.post("/2fa/setup", response_model=schemas.TwoFactorSetupResponse)
def twofa_setup(
    current_user: models.Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    secret = pyotp.random_base32()
    provisioning_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=current_user.email, issuer_name="Smart University Scheduler"
    )
    current_user.two_factor_secret = secret
    current_user.two_factor_enabled = False
    current_user.backup_codes = None
    db.add(current_user)
    _commit_or_rollback(db)
    db.refresh(current_user)

    return {"provisioning_uri": provisioning_uri}


@router.post("/2fa/confirm", response_model=schemas.BackupCodesResponse)
def twofa_confirm(
    payload: schemas.TwoFactorConfirmRequest,
    current_user: models.Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.two_factor_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="2FA not initialized"
        )

    totp = pyotp.TOTP(current_user.two_factor_secret)
    if not totp.verify(payload.code, valid_window=1):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid 2FA code"
        )

    current_user.two_factor_enabled = True
    plaintext_codes = _generate_backup_codes(n=8, length=10)
    hashed = [_hash_code(c) for c in plaintext_codes]
    current_user.backup_codes = json.dumps(hashed)

    db.add(current_user)
    _commit_or_rollback(db)
    db.refresh(current_user)

    return {"backup_codes": plaintext_codes}


@router.post("/2fa/verify", response_model=schemas.Token)
def twofa_verify(
    payload: schemas.TwoFactorVerifyRequest, db: Session = Depends(get_db)
):
    try:
        token_payload = jwt.decode(
            payload.pre_auth_token, SECRET_KEY, algorithms=[ALGORITHM]
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid pre_auth_token"
        )

    if not token_payload.get("pre_2fa"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is not a pre-auth token",
        )

    user_id = token_payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload"
        )

    user = _get_or_404(db, models.Users, int(user_id), "User")

    ok = False

    if user.two_factor_secret:
        totp = pyotp.TOTP(user.two_factor_secret)
        ok = bool(totp.verify(payload.code, valid_window=1))

    if not ok and user.backup_codes:
        try:
            locked_user = (
                db.query(models.Users)
                .filter(models.Users.id == user.id)
                .with_for_update()
                .one()
            )
            hashed_list = json.loads(locked_user.backup_codes or "[]")
            if not isinstance(hashed_list, list):
                raise ValueError("backup_codes not a list")
            code_hash = _hash_code(payload.code)
            if code_hash in hashed_list:
                ok = True
                hashed_list.remove(code_hash)
                locked_user.backup_codes = json.dumps(hashed_list)
                db.add(locked_user)
                _commit_or_rollback(db)
        except (json.JSONDecodeError, TypeError, ValueError) as exc:
            logger.exception(
                "Failed to parse/process backup_codes for user id=%s: %s", user.id, exc
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error processing 2FA backup codes",
            )

    if not ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid 2FA code"
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


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
