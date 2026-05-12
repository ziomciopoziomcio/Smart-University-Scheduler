from fastapi import APIRouter, Depends, status, Query
from fastapi import HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..common.router_utils import (
    _get_or_404,
    _commit_or_rollback,
    _apply_patch_or_reject_nulls,
)
from ..database.database import get_db
from ..common.require_permission import require_permission
from ..users import models as user_models
from . import models, schemas

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
    Create planner settings for a faculty.

    Request body: `PlannerSettingsCreate`.
    Behavior:
    - Creates a new PlannerSettings row associated with `faculty_id`.
    - Uses `exclude_unset=True, exclude_none=True` when building the ORM instance
      so DB defaults are not accidentally overwritten.
    - Returns 201 with the created resource.
    - Possible errors: 409 Conflict on DB integrity (unique / FK), 400 for validation.
    Permissions: requires "settings:create".
    """
    data = payload.model_dump(exclude_unset=True, exclude_none=True)
    obj = models.PlannerSettings(**data)
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
    List planner settings.

    Query parameters:
    - faculty_id (optional): if provided, returns a single-item list with the settings
      for that faculty or 404 if not found.
    Behavior:
    - Returns a list of `PlannerSettingsRead` objects.
    Permissions: requires "settings:view".
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
    """Return a single PlannerSettings by its numeric ID. Raises 404 when not found."""
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
    """
    Partially update planner settings (PATCH).

    Behavior:
    - Applies only provided fields from `PlannerSettingsUpdate`.
    - The helper `_apply_patch_or_reject_nulls` prevents setting non-nullable fields to null.
    - The object is re-added to the session and committed; returned value is refreshed.
    Permissions: requires "settings:update".
    """
    obj = _get_or_404(db, models.PlannerSettings, settings_id, "PlannerSettings")
    _apply_patch_or_reject_nulls(obj, payload, nullable_fields=())
    db.add(obj)
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
    """Delete a PlannerSettings row by ID. Returns 204 on success. Requires "settings:delete"."""

    obj = _get_or_404(db, models.PlannerSettings, settings_id, "PlannerSettings")
    db.delete(obj)
    _commit_or_rollback(db)
    return None
