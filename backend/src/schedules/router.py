import uuid

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from . import schemas
from ..common.kafka_client import send_event
from ..database.database import get_db

router = APIRouter(prefix="/schedules", tags=["schedules"])


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
        await send_event(
            topic="schedule.optimization.requests",
            msg=event_message,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to queue schedule optimization request",
        )

    return {
        "message": "Event sent successfully (TEST MODE)",
        "task_id": task_id,
        "status": "PENDING",
    }
