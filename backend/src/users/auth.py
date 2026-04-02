import os
import json
import hashlib
import secrets
import logging
from datetime import datetime, timedelta, timezone

import pyotp
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session, selectinload

from . import models
from ..database.database import get_db
from src.common.router_utils import _commit_or_rollback

logger = logging.getLogger(__name__)

# --- Password hashing ---
pwd_ctx = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# --- standard TOTP/backup codes lengths ---
TOTP_LENGTH = 6
BACKUP_CODE_LENGTH = 10


def hash_password(password: str) -> str:
    return pwd_ctx.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_ctx.verify(plain_password, hashed_password)


def authenticate_user(db: Session, email: str, password: str) -> models.Users | None:
    user = db.query(models.Users).filter(models.Users.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    if not getattr(user, "email_verified", False):
        return None
    return user


# --- JWT config ---
ALGORITHM = "HS256"


def get_secret_key() -> str:
    secret_key = os.getenv("SECRET_KEY")
    if not secret_key:
        raise RuntimeError(
            "SECRET_KEY environment variable must be set and non-empty for JWT signing."
        )
    if len(secret_key) < 32:
        raise RuntimeError(
            "SECRET_KEY is too weak. Please configure a sufficiently long, random secret."
        )
    return secret_key


_raw_access_token_expire = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
try:
    ACCESS_TOKEN_EXPIRE_MINUTES = int(_raw_access_token_expire)
except ValueError:
    logger.error(
        "Invalid ACCESS_TOKEN_EXPIRE_MINUTES value %r; falling back to default of 60 minutes",
        _raw_access_token_expire,
    )
    ACCESS_TOKEN_EXPIRE_MINUTES = 60


# --- OAuth2 dependency (FastAPI) ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": int(expire.replace(tzinfo=timezone.utc).timestamp())})
    return jwt.encode(to_encode, get_secret_key(), algorithm=ALGORITHM)


def create_pre_auth_token(user_id: int, expires_minutes: int = 5) -> str:
    data = {"sub": str(user_id), "pre_2fa": True}
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    data.update({"exp": int(expire.replace(tzinfo=timezone.utc).timestamp())})
    return jwt.encode(data, get_secret_key(), algorithm=ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> models.Users:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, get_secret_key(), algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if payload.get("pre_2fa"):
            raise credentials_exception
        if user_id is None:
            raise credentials_exception
        user_id_int = int(user_id)
    except (JWTError, ValueError, TypeError):
        raise credentials_exception

    user = (
        db.query(models.Users)
        .options(
            selectinload(models.Users.roles).selectinload(models.Roles.permissions)
        )
        .filter(models.Users.id == user_id_int)
        .first()
    )

    if user is None:
        raise credentials_exception
    return user


# --- 2FA helpers (logic only) ---
def _generate_backup_codes(n: int = 8, length: int = BACKUP_CODE_LENGTH) -> list[str]:
    codes: list[str] = []
    for _ in range(n):
        codes.append(secrets.token_urlsafe(length)[:length])
    return codes


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def _get_user_id_from_pre_token(token: str) -> int:
    try:
        payload = jwt.decode(token, get_secret_key(), algorithms=[ALGORITHM])

        if not payload.get("pre_2fa"):
            raise ValueError("Not a pre-auth token")

        user_id = payload.get("sub")
        if user_id is None:
            raise ValueError("Missing sub")

        return int(user_id)

    except (JWTError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid pre_auth_token",
        )


def _verify_totp(user: models.Users, code: str) -> bool:
    if not user.two_factor_secret:
        return False

    totp = pyotp.TOTP(user.two_factor_secret)
    return bool(totp.verify(code, valid_window=1))


def _verify_backup_code(db: Session, user: models.Users, code: str) -> bool:
    if not user.backup_codes:
        return False

    locked_user = (
        db.query(models.Users)
        .filter(models.Users.id == user.id)
        .with_for_update()
        .one()
    )

    hashed_list = json.loads(locked_user.backup_codes or "[]")
    code_hash = _hash_code(code)

    if code_hash in hashed_list:
        hashed_list.remove(code_hash)
        locked_user.backup_codes = json.dumps(hashed_list)
        db.add(locked_user)
        _commit_or_rollback(db)
        return True

    return False


def verify_2fa_code(db: Session, user: models.Users, code: str) -> bool:
    code = code.strip()

    # TOTP
    if len(code) == TOTP_LENGTH and code.isdigit():
        return _verify_totp(user, code)

    # Backup code
    if len(code) == BACKUP_CODE_LENGTH:
        return _verify_backup_code(db, user, code)

    return False


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_password_reset_token() -> str:
    return secrets.token_urlsafe(32)


def create_email_verification_token() -> str:
    return secrets.token_urlsafe(32)
