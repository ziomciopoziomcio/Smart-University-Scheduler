from fastapi import APIRouter, Depends, status, Query
from fastapi import HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..common.router_utils import (
    _get_or_404,
    _get_by_fields_or_404,
    _commit_or_rollback,
    _apply_patch_or_reject_nulls,
)
from ..database.database import get_db
from ..common.require_permission import require_permission
from ..users import models as user_models
from . import models, schemas

import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/settings", tags=["settings"])


@router.post(
    "/planner-settings",
    response_model=schemas.PlannerSettingsRead,
    status_code=status.HTTP_201_CREATED,
)
def create_planner_settings(
    payload: schemas.PlannerSettingsCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("settings:create")),
):
    """
    Create planner settings (one per faculty). IntegrityError will be returned as 409
    when uniqueness / FK constraints are violated.
    """
    obj = models.PlannerSettings(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get(
    "/planner-settings",
    response_model=List[schemas.PlannerSettingsRead],
)
def list_planner_settings(
    faculty_id: int | None = Query(None),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("settings:view")),
):
    """
    List planner settings. If faculty_id is provided, returns either a single-item list (if found)
    or raises 404.
    """
    if faculty_id is not None:
        obj = (
            db.query(models.PlannerSettings)
            .filter(models.PlannerSettings.faculty_id == faculty_id)
            .one_or_none()
        )
        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PlannerSettings not found",
            )
        return [obj]
    return db.query(models.PlannerSettings).all()


@router.get(
    "/planner-settings/{settings_id}",
    response_model=schemas.PlannerSettingsRead,
)
def get_planner_settings(
    settings_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("settings:view")),
):
    return _get_or_404(db, models.PlannerSettings, settings_id, "PlannerSettings")


@router.patch(
    "/planner-settings/{settings_id}",
    response_model=schemas.PlannerSettingsRead,
)
def update_planner_settings(
    settings_id: int,
    payload: schemas.PlannerSettingsUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("settings:update")),
):
    obj = _get_or_404(db, models.PlannerSettings, settings_id, "PlannerSettings")
    # Reject nulls for non-nullable fields if needed - here faculty_id is non-nullable in model
    _apply_patch_or_reject_nulls(obj, payload, nullable_fields=())
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete(
    "/planner-settings/{settings_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_planner_settings(
    settings_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("settings:delete")),
):
    obj = _get_or_404(db, models.PlannerSettings, settings_id, "PlannerSettings")
    db.delete(obj)
    _commit_or_rollback(db)
    return None
