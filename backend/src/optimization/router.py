import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status

from src.common.kafka_client import kafka_manager
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
    if not kafka_manager.producer:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Kafka producer is not available.",
        )

    task_id = uuid.uuid4()

    kafka_message = {"task_id": str(task_id), "faculty_id": payload.faculty_id}

    try:
        await kafka_manager.producer.send_and_wait(
            topic="schedule.optimization.requests", value=kafka_message
        )
    except Exception as e:
        logger.exception(f"Failed to publish optimization task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to queue optimization task.",
        )

    return schemas.OptimizationResponse(
        task_id=task_id,
        status="PENDING",
        message="Optimization task has been successfully queued.",
    )
