from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from src.common.pagination.pagination import paginate
from src.common.pagination.pagination_model import PaginatedResponse
from src.common.router_utils import (
    _get_or_404,
    _commit_or_rollback,
    _apply_patch_or_reject_nulls,
)
from .. import models, schemas
from ...common.require_permission import require_permission
from ...database.database import get_db
from ...users import models as user_models

router = APIRouter(prefix="/users", tags=["users"])
ROLE_LIMIT = 50


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


@router.post(
    "/roles", response_model=schemas.RoleRead, status_code=status.HTTP_201_CREATED
)
def create_role(
    payload: schemas.RoleCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("role:create")),
):
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
    obj = _get_or_404(db, models.Roles, role_id, "Role")
    if payload.permissions is not None:
        unique_permission_ids = set(payload.permissions)
        perms = (
            db.query(models.Permissions)
            .filter(models.Permissions.id.in_(unique_permission_ids))
            .all()
        )
        if len(perms) != len(unique_permission_ids):
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
