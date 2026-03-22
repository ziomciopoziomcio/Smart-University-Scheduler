import logging
import uuid
from datetime import timezone, datetime

from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.orm import Session

from . import models
from . import schemas
from ..common.kafka_client import send_event
from ..common.pagination.pagination import PaginatedResponse, paginate
from ..common.router_utils import _commit_or_rollback, _get_or_404
from ..database.database import get_db

router = APIRouter(prefix="/schedules", tags=["schedules"])

logger = logging.getLogger(__name__)


SUGGESTION_LIMIT = 50


@router.post("/generate", status_code=status.HTTP_202_ACCEPTED)
async def generate_schedule(
    payload: schemas.GenerateScheduleRequest,
    db: Session = Depends(get_db),
    # TODO: Users = Depends(get_current_user)
):
    task_id = str(uuid.uuid4())

    mock_user_id = 1  # TODO: Change that!

    event_message = {
        "task_id": task_id,
        "faculty_id": payload.faculty_id,
        "academic_year": payload.academic_year,
        "semester": payload.semester,
        "requested_by": mock_user_id,
    }

    try:
        success = await send_event(
            topic="schedule.optimization.requests",
            msg=event_message,
        )
        if not success:
            logger.exception(f"Event sending error for task_id {task_id}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to queue schedule optimization request",
            )
    except Exception:
        logger.exception(f"Event sending error for task_id {task_id}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to queue schedule optimization request",
        )

    return {
        "message": "Event sent successfully (TEST MODE)",
        "task_id": task_id,
        "status": "PENDING",
    }


@router.post(
    "/suggestions",
    response_model=schemas.ScheduleSuggestionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_schedule_suggestion(
    payload: schemas.ScheduleSuggestionCreate,
    db: Session = Depends(get_db),
):
    obj = models.ScheduleSuggestion(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get(
    "suggestions", response_model=PaginatedResponse[schemas.ScheduleSuggestionRead]
)
def list_schedule_suggestions(
    status_filter: models.SuggestionStatus | None = Query(None, alias="status"),
    source: str | None = Query(None, description="np. RAG"),
    target_class_session_id: uuid.UUID | None = Query(None),
    limit: int = Query(SUGGESTION_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(models.ScheduleSuggestion)

    if status_filter:
        query = query.filter(models.ScheduleSuggestion.status == status_filter)
    if source:
        query = query.filter(models.ScheduleSuggestion.source == source)
    if target_class_session_id:
        query = query.filter(
            models.ScheduleSuggestion.target_class_id == target_class_session_id
        )

    return paginate(
        query, limit, offset, order_by=models.ScheduleSuggestion.created_at.desc()
    )


@router.get(
    "/suggestions/{suggestion_id", response_model=schemas.ScheduleSuggestionRead
)
def get_schedule_suggestion(suggestion_id: int, db: Session = Depends(get_db)):
    return _get_or_404(
        db, models.ScheduleSuggestion, suggestion_id, "Schedule Suggestion"
    )


@router.patch(
    "/suggestions/{suggestion_id}", response_model=schemas.ScheduleSuggestionRead
)
def resolve_schedule_suggestion(
    suggestion_id: int,
    payload: schemas.ScheduleSuggestionUpdate,
    db: Session = Depends(get_db),
    # TODO: neo4j_driver
):
    obj = _get_or_404(
        db, models.ScheduleSuggestion, suggestion_id, "Schedule Suggestion"
    )

    if obj.status != models.SuggestionStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Suggestion already resolved with status: {obj.status}",
        )

    obj.status = payload.status

    if payload.status in [
        models.SuggestionStatus.ACCEPTED,
        models.SuggestionStatus.REJECTED,
    ]:
        obj.resolved_at = datetime.now(timezone.utc)

    # TODO: Neo4j implementation

    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/suggestions/{suggestion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule_suggestion(suggestion_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(
        db, models.ScheduleSuggestion, suggestion_id, "Schedule Suggestion"
    )
    db.delete(obj)
    _commit_or_rollback(db)
    return None
