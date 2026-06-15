import json
import logging
import secrets

import pyotp
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from src.common.router_utils import (
    _commit_or_rollback,
)
from .. import models, schemas
from ..auth import (
    authenticate_user,
    create_access_token,
    create_pre_auth_token,
    get_current_user,
    _generate_backup_codes,
    _hash_code,
    _get_user_id_from_pre_token,
    verify_2fa_code,
    verify_password,
    hash_password,
)
from ...common.require_permission import require_permission
from ...database.database import get_db
from ...users import models as user_models

router = APIRouter(prefix="/users", tags=["users"])
logger = logging.getLogger(__name__)


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
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "requires_2fa": False,
        "force_password_change": bool(getattr(user, "force_password_change", False)),
    }


@router.get("/me", response_model=schemas.UserMeRead)
def read_own_user(
    current_user: models.Users = Depends(get_current_user),
    _current_user: user_models.Users = Depends(require_permission("user:me")),
):
    return current_user


@router.post(
    "/api-keys/generate",
    response_model=schemas.APIKeyResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_api_key(
    payload: schemas.APIKeyCreateRequest,
    current_user: models.Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from datetime import datetime, timedelta

    raw_api_key = secrets.token_hex(32)
    hashed_key = hash_password(raw_api_key)
    expiration = datetime.utcnow() + timedelta(days=365)

    new_api_key_entry = models.UserApiKey(
        user_id=current_user.id,
        name=payload.name if payload.name else "Script Key",
        api_key_hash=hashed_key,
        expiration_date=expiration,
        is_active=True,
    )

    db.add(new_api_key_entry)
    _commit_or_rollback(db)

    return {
        "detail": "API key generated. Please copy it since it won't be shown again.",
        "api_key": raw_api_key,
    }


@router.get("/api-keys", response_model=list[dict])
def list_api_keys(
    current_user: models.Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    keys = (
        db.query(models.UserApiKey)
        .filter(models.UserApiKey.user_id == current_user.id)
        .all()
    )

    return [
        {
            "id": k.id,
            "name": k.name,
            "expiration_date": k.expiration_date.strftime("%Y-%m-%d %H:%M:%S"),
            "is_active": k.is_active,
        }
        for k in keys
    ]


@router.post("/api-keys/{key_id}/revoke")
def revoke_api_key(
    key_id: int,
    current_user: models.Users = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    key_entry = (
        db.query(models.UserApiKey)
        .filter(
            models.UserApiKey.id == key_id, models.UserApiKey.user_id == current_user.id
        )
        .first()
    )

    if not key_entry:
        raise HTTPException(status_code=404, detail="API Key not found")

    key_entry.is_active = False
    _commit_or_rollback(db)

    return {"detail": "API Key has been successfully revoked and deactivated."}


@router.post("/2fa/setup", response_model=schemas.TwoFactorSetupResponse)
def twofa_setup(
    current_user: models.Users = Depends(get_current_user),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("user-2fa:setup")),
):
    if getattr(current_user, "two_factor_enabled", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA already enabled; use the disable/reset 2FA flow instead",
        )

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

    return {
        "provisioning_uri": provisioning_uri,
        "secret": secret,
    }


@router.post("/2fa/confirm", response_model=schemas.BackupCodesResponse)
def twofa_confirm(
    payload: schemas.TwoFactorConfirmRequest,
    current_user: models.Users = Depends(get_current_user),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("user-2fa:confirm")),
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
    user_id = _get_user_id_from_pre_token(payload.pre_auth_token)

    user = db.query(models.Users).filter(models.Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.two_factor_enabled or not user.two_factor_secret:
        raise HTTPException(status_code=400, detail="2FA is not enabled for this user")

    ok = verify_2fa_code(db, user, payload.code)

    if not ok:
        raise HTTPException(status_code=400, detail="Invalid 2FA code")

    access_token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "requires_2fa": False,
        "force_password_change": bool(getattr(user, "force_password_change", False)),
    }


@router.post("/2fa/disable", response_model=schemas.MessageResponse)
def twofa_disable(
    payload: schemas.TwoFactorDisableRequest,
    current_user: models.Users = Depends(get_current_user),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("user-2fa:disable")),
):
    if not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled",
        )

    if not verify_password(payload.password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password",
        )

    ok = verify_2fa_code(db, current_user, payload.code)

    if not ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid 2FA code",
        )

    current_user.two_factor_enabled = False
    current_user.two_factor_secret = None
    current_user.backup_codes = None

    db.add(current_user)
    _commit_or_rollback(db)

    return {"detail": "2FA has been disabled"}
