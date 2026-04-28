import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status

from src.common.kafka_client import send_event
from . import schemas
from ..common.require_permission import require_permission

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/optimize", tags=["optimization"])


@router.post(
    "/run",
    response_model=schemas.OptimizationResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def trigger_optimization(
    payload: schemas.OptimizationRequest,
    _current_user=Depends(require_permission("optimization:run")),
):
    """
    Triggers the AI schedule optimization worker via Kafka.
    """
    task_id = uuid.uuid4()

    kafka_message = {"task_id": str(task_id), "faculty_id": payload.faculty_id}

    success = await send_event(
        topic="schedule.optimization.requests", msg=kafka_message
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to queue optimization task. Please try again later.",
        )

    return schemas.OptimizationResponse(
        task_id=task_id,
        status="PENDING",
        message="Optimization task has been successfully queued.",
    )
