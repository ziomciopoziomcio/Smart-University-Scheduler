from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload
import pyotp
import json
import logging

from src.common.notifications import send_password_reset_email
from src.common.user_service import register_user
from . import models, schemas
from ..database.database import get_db
from src.common.router_utils import (
    _get_or_404,
    _commit_or_rollback,
    _apply_patch_or_reject_nulls,
)
from src.common.pagination.pagination import paginate
from src.common.pagination.pagination_model import PaginatedResponse
from ..common.require_permission import require_permission
from ..users import models as user_models

from .auth import (
    authenticate_user,
    create_access_token,
    create_pre_auth_token,
    get_current_user,
    _generate_backup_codes,
    _hash_code,
    _get_user_id_from_pre_token,
    hash_password,
    verify_2fa_code,
    create_password_reset_token,
    _hash_token,
    verify_password,
)

router = APIRouter(prefix="/users", tags=["users"])
logger = logging.getLogger(__name__)

ROLE_LIMIT = 50
USER_LIMIT = 100
PERMISSION_LIMIT = 100


# user-utils
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


@router.get("/me", response_model=schemas.UserRead)
def read_own_user(
    current_user: models.Users = Depends(get_current_user),
    _current_user: user_models.Users = Depends(require_permission("user:me")),
):
    return current_user


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
    return {"access_token": access_token, "token_type": "bearer"}


# Permissions
@router.get("/permissions", response_model=PaginatedResponse[schemas.PermissionRead])
def get_permissions(
    group: str | None = Query(None),
    db: Session = Depends(get_db),
    limit: int | None = Query(PERMISSION_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    _current_user: user_models.Users = Depends(require_permission("permissions:view")),
):
    """
    Return all permissions, optionally filtered by group
    """
    query = db.query(models.Permissions)

    if group:
        query = query.filter(models.Permissions.group == group)

    return paginate(query, limit, offset, models.Permissions.id)


@router.post(
    "/roles/{role_id}/permissions/{permission_id}",
    response_model=schemas.RoleRead,
)
def add_permission_to_role(
    role_id: int,
    permission_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("permission:add-to-role")
    ),
):
    """
    Add permission to role
    """
    obj_role = _get_or_404(db, models.Roles, role_id, "Role")
    obj_perm = _get_or_404(db, models.Permissions, permission_id, "Permissions")
    if obj_perm in obj_role.permissions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permission already assigned",
        )
    obj_role.permissions.append(obj_perm)
    _commit_or_rollback(db)
    db.refresh(obj_role)
    return obj_role


@router.delete(
    "/roles/{role_id}/permissions/{permission_id}", response_model=schemas.RoleRead
)
def delete_permission_from_role(
    role_id: int,
    permission_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("permission:delete")),
):
    """
    Delete permission from role
    """
    obj_role = _get_or_404(db, models.Roles, role_id, "Role")
    obj_perm = _get_or_404(db, models.Permissions, permission_id, "Permissions")
    if obj_perm not in obj_role.permissions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permission not assigned",
        )
    obj_role.permissions.remove(obj_perm)
    _commit_or_rollback(db)
    db.refresh(obj_role)
    return obj_role


# Roles
@router.post(
    "/roles", response_model=schemas.RoleRead, status_code=status.HTTP_201_CREATED
)
def create_role(
    payload: schemas.RoleCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("role:create")),
):
    """
    Creates a new role
    """
    obj = models.Roles(**payload.model_dump(exclude={"permissions"}))
    if payload.permissions:
        unique_permission_ids = set(payload.permissions)
        perms = (
            db.query(models.Permissions)
            .filter(models.Permissions.id.in_(payload.permissions))
            .all()
        )
        if len(perms) != len(set(payload.permissions)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Some permission IDs are invalid",
            )
        if len(unique_permission_ids) != len(payload.permissions):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Duplicate permission IDs are not allowed",
            )
        obj.permissions = perms
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/roles", response_model=PaginatedResponse[schemas.RoleReadWithCount])
def list_roles(
    role_name: str | None = Query(None, min_length=1),
    limit: int = Query(ROLE_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("roles:view")),
):
    query = (
        db.query(
            models.Roles,
            func.count(models.user_roles.c.user_id).label("users_count"),
        )
        .outerjoin(models.user_roles, models.user_roles.c.role_id == models.Roles.id)
        .options(selectinload(models.Roles.permissions))
        .group_by(models.Roles.id)
    )
    count_query = db.query(func.count(models.Roles.id))

    if role_name is not None:
        filter_stmt = models.Roles.role_name.ilike(f"%{role_name}%")
        query = query.filter(filter_stmt)
        count_query = count_query.filter(filter_stmt)

    pagination_result = paginate(
        query,
        limit,
        offset,
        order_by=models.Roles.id,
        count_query=count_query,
    )

    pagination_result.items = [
        schemas.RoleReadWithCount(
            id=row.Roles.id,
            role_name=row.Roles.role_name,
            permissions=row.Roles.permissions,
            users_count=row.users_count,
        )
        for row in pagination_result.items
    ]

    return pagination_result


@router.get("/roles/{role_id}", response_model=schemas.RoleReadWithCount)
def get_role(
    role_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("role:view")),
):
    users_subq = (
        db.query(func.count(models.user_roles.c.user_id))
        .filter(models.user_roles.c.role_id == models.Roles.id)
        .scalar_subquery()
    )

    row = (
        db.query(models.Roles, func.coalesce(users_subq, 0).label("users_count"))
        .options(selectinload(models.Roles.permissions))
        .filter(models.Roles.id == role_id)
        .first()
    )

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Role not found"
        )

    return schemas.RoleReadWithCount(
        id=row.Roles.id,
        role_name=row.Roles.role_name,
        permissions=row.Roles.permissions,
        users_count=row.users_count,
    )


@router.patch("/roles/{role_id}", response_model=schemas.RoleRead)
def update_role(
    role_id: int,
    payload: schemas.RoleUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("role:update")),
):
    """
    Update roles
    """
    obj = _get_or_404(db, models.Roles, role_id, "Role")
    if payload.permissions is not None:
        # Use unique IDs for validation, and detect duplicates explicitly so
        # error messages distinguish between invalid IDs and duplicates.
        unique_permission_ids = set(payload.permissions)
        perms = (
            db.query(models.Permissions)
            .filter(models.Permissions.id.in_(unique_permission_ids))
            .all()
        )
        # If we didn't get back one row per unique ID, some IDs are invalid.
        if len(perms) != len(unique_permission_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Some permission IDs are invalid",
            )
        # If there are fewer unique IDs than provided IDs, there were duplicates.
        if len(unique_permission_ids) != len(payload.permissions):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Duplicate permission IDs are not allowed",
            )
        obj.permissions = perms
    _apply_patch_or_reject_nulls(obj, payload, exclude={"permissions"})
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("role:delete")),
):
    obj = _get_or_404(db, models.Roles, role_id, "Role")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Users
@router.post("/", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: schemas.UserCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("user:create")),
):
    data = payload.model_dump()
    data["password_hash"] = hash_password(data.pop("password"))
    obj = models.Users(**data)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/", response_model=PaginatedResponse[schemas.UserRead])
def list_users(
    email: str | None = Query(None, min_length=1),
    phone_number: str | None = Query(None, min_length=1),
    name: str | None = Query(None, min_length=1),
    surname: str | None = Query(None, min_length=1),
    degree: str | None = Query(None, min_length=1),
    limit: int | None = Query(USER_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("users:view")),
):
    query = db.query(models.Users).options(selectinload(models.Users.roles))

    if email is not None:
        query = query.filter(models.Users.email.ilike(f"%{email}%"))
    if phone_number is not None:
        query = query.filter(models.Users.phone_number.ilike(f"%{phone_number}%"))
    if name is not None:
        query = query.filter(models.Users.name.ilike(f"%{name}%"))
    if surname is not None:
        query = query.filter(models.Users.surname.ilike(f"%{surname}%"))
    if degree is not None:
        query = query.filter(models.Users.degree.ilike(f"%{degree}%"))

    return paginate(query, limit, offset, models.Users.id)


@router.post(
    "/signup", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED
)
def signup(
    payload: schemas.SignupRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    return register_user(payload, background_tasks, db)


@router.post("/password/forgot", response_model=schemas.MessageResponse)
def password_forgot(
    payload: schemas.PasswordForgotRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = db.query(models.Users).filter(models.Users.email == payload.email).first()

    response = {"detail": "If the account exists, a reset link has been sent."}

    if not user:
        return response

    token = create_password_reset_token()
    user.password_reset_token_hash = _hash_token(token)
    user.password_reset_expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)

    db.add(user)
    db.flush()

    _commit_or_rollback(db)

    background_tasks.add_task(send_password_reset_email, user.email, token)

    return response


@router.post("/password/reset", response_model=schemas.MessageResponse)
def password_reset(
    payload: schemas.PasswordResetRequest, db: Session = Depends(get_db)
):

    token_hash = _hash_token(payload.token)

    user = (
        db.query(models.Users)
        .filter(models.Users.password_reset_token_hash == token_hash)
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token"
        )

    if (
        not user.password_reset_expires_at
        or user.password_reset_expires_at < datetime.now(timezone.utc)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token"
        )

    user.password_hash = hash_password(payload.password)
    user.password_reset_token_hash = None
    user.password_reset_expires_at = None

    db.add(user)
    _commit_or_rollback(db)

    return {"detail": "Password has been reset"}


@router.post("/password/change", response_model=schemas.MessageResponse)
def password_change(
    payload: schemas.PasswordChangeRequest,
    current_user: models.Users = Depends(get_current_user),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("user:password-change")
    ),
):

    if not verify_password(payload.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Old password is incorrect")

    current_user.password_hash = hash_password(payload.password)
    db.add(current_user)
    _commit_or_rollback(db)
    return {"detail": "Password changed"}


@router.get("/verify-email", response_model=schemas.VerifyEmailResponse)
def verify_email(
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    token_hash = _hash_token(token)

    user = (
        db.query(models.Users)
        .filter(models.Users.email_verification_token_hash == token_hash)
        .first()
    )
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    if (
        not user.email_verification_expires_at
        or user.email_verification_expires_at < datetime.now(timezone.utc)
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user.email_verified = True
    user.email_verification_token_hash = None
    user.email_verification_expires_at = None

    db.add(user)
    _commit_or_rollback(db)

    return {"detail": "Email verified"}


@router.get("/{user_id}", response_model=schemas.UserRead)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("user:view")),
):
    return _get_or_404(db, models.Users, user_id, "User")


@router.patch("/{user_id}", response_model=schemas.UserRead)
def update_user(
    user_id: int,
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("user:update")),
):
    obj = _get_or_404(db, models.Users, user_id, "User")

    if "password" in payload.model_fields_set:
        if payload.password is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="`password` cannot be set to null when provided",
            )
        obj.password_hash = hash_password(payload.password)

    _apply_patch_or_reject_nulls(
        obj, payload, nullable_fields={"phone_number", "degree"}, exclude={"password"}
    )
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("user:delete")),
):
    obj = _get_or_404(db, models.Users, user_id, "User")
    db.delete(obj)
    _commit_or_rollback(db)
    return None
