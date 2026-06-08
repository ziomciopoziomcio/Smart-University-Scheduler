import logging
import secrets
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from sqlalchemy import func, or_, and_
from sqlalchemy.orm import Session, selectinload

from src.common.notifications import (
    send_password_reset_email,
    send_login_credentials_email,
)
from src.common.pagination.pagination import paginate
from src.common.pagination.pagination_model import PaginatedResponse
from src.common.router_utils import (
    _get_or_404,
    _commit_or_rollback,
    _apply_patch_or_reject_nulls,
    parse_csv_param,
    apply_search_to_queries,
)
from src.common.user_service import register_user
from .. import models, schemas
from ..auth import (
    get_current_user,
    hash_password,
    create_password_reset_token,
    _hash_token,
    verify_password,
)
from ...common.require_permission import require_permission
from ...database.database import get_db
from ...users import models as user_models
from ...academics import models as academics_models

router = APIRouter(prefix="/users", tags=["users"])
logger = logging.getLogger(__name__)
USER_LIMIT = 100


@router.post("/", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: schemas.UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("user:create")),
):
    data = payload.model_dump()

    temp_password: str | None = None
    send_email_flag = bool(data.pop("send_login_credentials_email", False))

    if send_email_flag:
        generated_password = secrets.token_urlsafe(12)
        data["password_hash"] = hash_password(generated_password)
        data["force_password_change"] = True
        temp_password = generated_password
    else:
        password = data.pop("password", None)
        if not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is required when send_login_credentials_email is false",
            )
        data["password_hash"] = hash_password(password)
        data["force_password_change"] = False

    data.pop("password", None)

    obj = models.Users(**data)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)

    if send_email_flag:
        if temp_password is None:
            logger.error(
                "Temporary password was not generated for user creation with credential email enabled"
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to send login credentials email",
            )
        background_tasks.add_task(
            send_login_credentials_email, obj.email, temp_password
        )

    return obj


def _apply_basic_filters(
    query, count_query, email, phone_number, name, surname, degree
):
    if email is not None:
        f = models.Users.email.ilike(f"%{email}%")
        query, count_query = query.filter(f), count_query.filter(f)
    if phone_number is not None:
        f = models.Users.phone_number.ilike(f"%{phone_number}%")
        query, count_query = query.filter(f), count_query.filter(f)
    if name is not None:
        f = models.Users.name.ilike(f"%{name}%")
        query, count_query = query.filter(f), count_query.filter(f)
    if surname is not None:
        f = models.Users.surname.ilike(f"%{surname}%")
        query, count_query = query.filter(f), count_query.filter(f)
    if degree is not None:
        f = models.Users.degree.ilike(f"%{degree}%")
        query, count_query = query.filter(f), count_query.filter(f)
    return query, count_query


def _apply_role_filters(query, count_query, roles_list, exclude_roles_list, has_roles):
    if roles_list:
        role_filter = models.Users.roles.any(models.Roles.role_name.in_(roles_list))
        query, count_query = query.filter(role_filter), count_query.filter(role_filter)

    if exclude_roles_list:
        exclude_role_filter = ~models.Users.roles.any(
            models.Roles.role_name.in_(exclude_roles_list)
        )
        query, count_query = query.filter(exclude_role_filter), count_query.filter(
            exclude_role_filter
        )

    if has_roles is True:
        hr_filter = models.Users.roles.any()
        query, count_query = query.filter(hr_filter), count_query.filter(hr_filter)
    elif has_roles is False:
        hr_filter = ~models.Users.roles.any()
        query, count_query = query.filter(hr_filter), count_query.filter(hr_filter)
    return query, count_query


def _build_profile_list_filter(profiles_list, student_exists, employee_exists):
    conds = []
    profiles_lower = [p.lower() for p in profiles_list]
    if "student" in profiles_lower:
        conds.append(student_exists)
    if "employee" in profiles_lower:
        conds.append(employee_exists)
    return or_(*conds) if conds else None


def _apply_profile_exclusions(
    query, count_query, exclude_profiles_list, student_exists, employee_exists
):
    ex_lower = [p.lower() for p in exclude_profiles_list]
    if "student" in ex_lower:
        query, count_query = query.filter(~student_exists), count_query.filter(
            ~student_exists
        )
    if "employee" in ex_lower:
        query, count_query = query.filter(~employee_exists), count_query.filter(
            ~employee_exists
        )
    return query, count_query


def _apply_profile_presence(
    query, count_query, has_profiles, student_exists, employee_exists
):
    if has_profiles is True:
        hp_filter = or_(student_exists, employee_exists)
        query, count_query = query.filter(hp_filter), count_query.filter(hp_filter)
    elif has_profiles is False:
        hp_filter = and_(~student_exists, ~employee_exists)
        query, count_query = query.filter(hp_filter), count_query.filter(hp_filter)
    return query, count_query


def _apply_profile_filters(
    query,
    count_query,
    student_exists,
    employee_exists,
    profiles_list,
    exclude_profiles_list,
    has_profiles,
):
    if profiles_list:
        p_filter = _build_profile_list_filter(
            profiles_list, student_exists, employee_exists
        )
        if p_filter is not None:
            query, count_query = query.filter(p_filter), count_query.filter(p_filter)

    if exclude_profiles_list:
        query, count_query = _apply_profile_exclusions(
            query, count_query, exclude_profiles_list, student_exists, employee_exists
        )

    return _apply_profile_presence(
        query, count_query, has_profiles, student_exists, employee_exists
    )


def _apply_identity_and_search_filters(db: Session, filters: dict) -> tuple:
    query = db.query(models.Users).options(selectinload(models.Users.roles))
    count_query = db.query(models.Users.id)

    query, count_query = _apply_basic_filters(
        query,
        count_query,
        filters["email"],
        filters["phone_number"],
        filters["name"],
        filters["surname"],
        filters["degree"],
    )

    if filters["search"]:
        query, count_query = apply_search_to_queries(
            search=filters["search"],
            query=query,
            count_query=count_query,
            columns=[
                models.Users.email,
                models.Users.phone_number,
                models.Users.name,
                models.Users.surname,
                models.Users.degree,
            ],
            extra_phrase_columns=[
                func.concat(models.Users.name, " ", models.Users.surname),
                func.concat(models.Users.surname, " ", models.Users.name),
            ],
        )
    return query, count_query


def _build_filtered_users_query(db: Session, filters: dict) -> tuple:
    query, count_query = _apply_identity_and_search_filters(db, filters)

    query, count_query = _apply_role_filters(
        query,
        count_query,
        parse_csv_param(filters["roles"]),
        parse_csv_param(filters["exclude_roles"]),
        filters["has_roles"],
    )

    st_ex = (
        db.query(academics_models.Students.id)
        .filter(academics_models.Students.user_id == models.Users.id)
        .exists()
    )
    emp_ex = (
        db.query(academics_models.Employees.id)
        .filter(academics_models.Employees.user_id == models.Users.id)
        .exists()
    )

    return _apply_profile_filters(
        query,
        count_query,
        st_ex,
        emp_ex,
        parse_csv_param(filters["profiles"]),
        parse_csv_param(filters["exclude_profiles"]),
        filters["has_profiles"],
    )


@router.get("/", response_model=PaginatedResponse[schemas.UserRead])
def list_users(
    email: str | None = Query(None, min_length=1),
    phone_number: str | None = Query(None, min_length=1),
    name: str | None = Query(None, min_length=1),
    surname: str | None = Query(None, min_length=1),
    degree: str | None = Query(None, min_length=1),
    limit: int | None = Query(USER_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    roles: str | None = Query(None),
    exclude_roles: str | None = Query(None),
    has_roles: bool | None = Query(None),
    profiles: str | None = Query(None),
    exclude_profiles: str | None = Query(None),
    has_profiles: bool | None = Query(None),
    search: str | None = Query(None, min_length=1),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("users:view")),
):
    filters = {
        "email": email,
        "phone_number": phone_number,
        "name": name,
        "surname": surname,
        "degree": degree,
        "roles": roles,
        "exclude_roles": exclude_roles,
        "has_roles": has_roles,
        "profiles": profiles,
        "exclude_profiles": exclude_profiles,
        "has_profiles": has_profiles,
        "search": search,
    }

    query, count_query = _build_filtered_users_query(db, filters)
    return paginate(
        query, limit, offset, order_by=models.Users.id, count_query=count_query
    )


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
    user.force_password_change = False
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
    current_user.force_password_change = False
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

    if "roles" in payload.model_fields_set:
        if payload.roles is None:
            obj.roles.clear()
        else:
            unique_roles = set(payload.roles)
            if len(unique_roles) != len(payload.roles):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Duplicate roles provided in the request payload.",
                )

            db_roles = (
                db.query(models.Roles)
                .filter(models.Roles.role_name.in_(unique_roles))
                .all()
            )

            if len(db_roles) != len(unique_roles):
                found_roles = {r.role_name for r in db_roles}
                missing_roles = sorted(list(unique_roles - found_roles))
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot assign non-existent roles: {', '.join(missing_roles)}",
                )

            obj.roles.clear()
            obj.roles.extend(db_roles)

    _apply_patch_or_reject_nulls(
        obj,
        payload,
        nullable_fields={"phone_number", "degree"},
        exclude={"password", "roles"},
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
