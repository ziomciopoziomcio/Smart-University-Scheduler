import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query

from src.common.kafka_client import send_event
from . import schemas
from .services import validate_optimization_data, MissingPlannerSettingsError
from ..common.require_permission import require_permission
from ..database.database import get_db
from sqlalchemy.orm import Session
from ..users import models as user_models
from ..academics import models as ac_mod

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/optimize", tags=["optimization"])


@router.post(
    "/run",
    response_model=schemas.OptimizationResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def trigger_optimization(
    payload: schemas.OptimizationRequest | None = None,
    faculty_id: int | None = Query(None, gt=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("optimization:run")),
):
    """
    Triggers the AI schedule optimization worker via Kafka.
    """
    requested_fid = payload.faculty_id if payload is not None else faculty_id

    if requested_fid is not None and requested_fid <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="faculty_id must be strictly greater than 0.",
        )

    privileged_roles = {"Administrator", "Schedule Manager"}
    is_privileged = any(
        role.role_name in privileged_roles for role in _current_user.roles
    )

    if is_privileged:
        if requested_fid is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Administrators and Schedule Managers must explicitly provide a faculty_id.",
            )
        final_fid = requested_fid
    else:
        employees = (
            db.query(ac_mod.Employees)
            .filter(ac_mod.Employees.user_id == _current_user.id)
            .all()
        )

        allowed_fids = list({emp.faculty_id for emp in employees if emp.faculty_id})

        if not allowed_fids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not assigned to any faculty. Cannot trigger optimization.",
            )

        if requested_fid is not None:
            if requested_fid not in allowed_fids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"You do not have permission to run optimization for faculty {requested_fid}.",
                )
            final_fid = requested_fid
        else:
            if len(allowed_fids) == 1:
                final_fid = allowed_fids[0]
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You are assigned to multiple faculties. Please explicitly provide a faculty_id.",
                )

    task_id = uuid.uuid4()
    kafka_message = {"task_id": str(task_id), "faculty_id": final_fid}

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


@router.get("/validate/{faculty_id}", response_model=schemas.ValidationReport)
def validate_algorithm_data(
    faculty_id: int,
    db: Session = Depends(get_db),
    _current_user=Depends(require_permission("optimization:view")),
):
    """
    Validates data consistency before running the genetic algorithm.
    Checks for missing instructors, workload discrepancies, and unaccountable group sizes.
    """
    try:
        report_data = validate_optimization_data(faculty_id, db)
        return report_data
    except MissingPlannerSettingsError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
