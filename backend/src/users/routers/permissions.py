from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.common.pagination.pagination import paginate
from src.common.pagination.pagination_model import PaginatedResponse
from .. import models, schemas
from ...common.require_permission import require_permission
from ...database.database import get_db
from ...users import models as user_models

router = APIRouter(prefix="/users", tags=["users"])
PERMISSION_LIMIT = 100


@router.get("/permissions", response_model=PaginatedResponse[schemas.PermissionRead])
def get_permissions(
    group: str | None = Query(None),
    db: Session = Depends(get_db),
    limit: int | None = Query(PERMISSION_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    _current_user: user_models.Users = Depends(require_permission("permissions:view")),
):
    query = db.query(models.Permissions)

    if group:
        query = query.filter(models.Permissions.group == group)

    return paginate(query, limit, offset, models.Permissions.id)
