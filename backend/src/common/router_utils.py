from typing import Iterable, Any
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

def _get_or_404(db: Session, model, obj_id: Any, name: str):
    """Return an object by ID or raise HTTP 404 if it does not exist."""
    obj = db.get(model, obj_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{name} not found")
    return obj


def _commit_or_rollback(db: Session):
    """Commit the transaction or roll back and raise an HTTP error on failure."""
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        logger.exception("Integrity error during commit")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="Conflict: request violates database constraints")
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Unexpected database error during commit")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Internal server error")


def _apply_patch_or_reject_nulls(obj, payload, nullable_fields: Iterable[str] = (), exclude: set[str] | None = None):
    """Apply PATCH fields to an object and reject nulls for non-nullable fields."""
    provided = payload.model_dump(exclude_unset=True, exclude=exclude or set())
    nullable_set = set(nullable_fields)
    for k, v in provided.items():
        if v is None and k not in nullable_set:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"`{k}` cannot be set to null when provided"
            )
        setattr(obj, k, v)