import logging
import uuid
from datetime import timezone, datetime, date, timedelta

from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.orm import Session

from . import models
from . import schemas
from ..academics import models as ac_mod
from ..common.kafka_client import send_event
from ..common.pagination.pagination import PaginatedResponse, paginate
from ..common.require_permission import require_permission
from ..common.router_utils import (
    _get_or_404,
    _commit_or_rollback,
    _apply_patch_or_reject_nulls,
)
from ..database.database import get_db
from ..database.neo4j import get_neo4j_session
from ..users import models as user_models
from ..courses.models import ClassType

router = APIRouter(prefix="/schedules", tags=["schedules"])

logger = logging.getLogger(__name__)

ACADEMIC_CALENDAR_LIMIT = 100
EMPLOYEE_ABSENCE_LIMIT = 100


# Schedules
SUGGESTION_LIMIT = 50

COURSE_DETAIL_QUERY = """
    MATCH (s:ClassSession {sessionId: $session_id})
    MATCH (s)-[:OF_COURSE]->(c:Course)
    MATCH (s)-[:AT_TIME]->(t:TimeSlot)
    MATCH (s)-[:TAUGHT_BY]->(i:Instructor)
    MATCH (s)-[:HELD_IN]->(r:Room)-[:IN_BUILDING]->(b:Building)-[:IN_CAMPUS]->(cp:Campus)

    MATCH (s)-[:FOR_GROUP]->(g:Group)

    RETURN
        c.courseName AS course_name,
        c.classType AS class_type,
        t.startTime + " - " + t.endTime AS time_range,
        cp.campusShort AS campus,
        b.buildingNumber AS building,
        r.roomName AS room,
        (CASE WHEN i.degree IS NOT NULL THEN i.degree + " " ELSE "" END)
        + i.firstName + " " + i.lastName AS lecturer,
        collect(DISTINCT g.programName + " | " + g.groupName) AS audience_list
"""

LECTURER_PLAN_ACADEMIC_QUERY = """
    UNWIND $day_configs AS config
    MATCH (i:Instructor {instructorId: $instructor_id})
    WHERE ($unit_id IS NULL OR i.unitId = $unit_id)

    MATCH (s:ClassSession)-[:TAUGHT_BY]->(i)
    MATCH (s)-[:AT_TIME]->(t:TimeSlot {dayOfWeek: config.academic_day})
    MATCH (s)-[:OF_COURSE]->(c:Course)

    WHERE config.week_number IN s.weeks

    RETURN
        s.sessionId AS session_id,
        c.courseName AS title,
        c.classType AS class_type,
        config.physical_date AS physical_date,
        t.startTime AS start_time,
        t.endTime AS end_time
    ORDER BY config.physical_date, t.startTime
"""


@router.post("/generate", status_code=status.HTTP_202_ACCEPTED)
async def generate_schedule(
    payload: schemas.GenerateScheduleRequest,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("schedule:generate")),
    # TODO: Users = Depends(get_current_user)
):
    task_id = str(uuid.uuid4())

    mock_user_id = 1  # TODO: Change that!

    event_message = {
        "task_id": task_id,
        "faculty_id": payload.faculty_id,
        "academic_year": payload.academic_year,
        "semester_type": payload.semester_type.value,
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
    "/suggestions", response_model=PaginatedResponse[schemas.ScheduleSuggestionRead]
)
def list_schedule_suggestions(
    status_filter: models.SuggestionStatus | None = Query(None, alias="status"),
    source: str | None = Query(
        None, description='Filter by suggestion source (e.g. "RAG")'
    ),
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
            models.ScheduleSuggestion.target_class_session_id == target_class_session_id
        )

    return paginate(
        query, limit, offset, order_by=models.ScheduleSuggestion.created_at.desc()
    )


@router.get(
    "/suggestions/{suggestion_id}", response_model=schemas.ScheduleSuggestionRead
)
def get_schedule_suggestion(suggestion_id: int, db: Session = Depends(get_db)):
    return _get_or_404(
        db, models.ScheduleSuggestion, suggestion_id, "MySchedule Suggestion"
    )


@router.patch(
    "/suggestions/{suggestion_id}", response_model=schemas.ScheduleSuggestionRead
)
async def resolve_schedule_suggestion(
    suggestion_id: int,
    payload: schemas.ScheduleSuggestionUpdate,
    db: Session = Depends(get_db),
):
    obj = _get_or_404(
        db, models.ScheduleSuggestion, suggestion_id, "MySchedule Suggestion"
    )

    if obj.status != models.SuggestionStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Suggestion already resolved with status: {obj.status}",
        )

    allowed_terminal_states = (
        models.SuggestionStatus.ACCEPTED,
        models.SuggestionStatus.REJECTED,
        models.SuggestionStatus.FAILED,
    )

    if payload.status not in allowed_terminal_states:
        allowed_str = ", ".join([s.value for s in allowed_terminal_states])
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid target status. Suggestion status must be one of {allowed_str}",
        )

    obj.status, obj.resolved_at = payload.status, datetime.now(timezone.utc)

    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)

    if payload.status == models.SuggestionStatus.ACCEPTED:
        event_message = {
            "suggestion_id": suggestion_id,
            "class_session_id": str(obj.target_class_session_id),
            "new_room_id": obj.state_after.get("proposed_room_id"),
            "new_timeslot_id": obj.state_after.get("proposed_timeslot_id"),
        }
        try:
            if not await send_event(
                topic="schedule.session.reschedule", msg=event_message
            ):
                raise RuntimeError("Kafka emission returned False")
        except Exception as e:
            logger.error(f"Failed to reschedule {suggestion_id}: {e}")
            obj.status, obj.resolved_at = models.SuggestionStatus.PENDING, None
            db.add(obj)
            _commit_or_rollback(db)
            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                f"Failed to reschedule {suggestion_id}",
            )

    return obj


@router.delete("/suggestions/{suggestion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule_suggestion(suggestion_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(
        db, models.ScheduleSuggestion, suggestion_id, "MySchedule Suggestion"
    )
    db.delete(obj)
    _commit_or_rollback(db)

    return None


@router.post(
    "/absences",
    response_model=schemas.EmployeeAbsenceRead,
    status_code=status.HTTP_201_CREATED,
)
def create_employee_absence(
    payload: schemas.EmployeeAbsenceCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("absence:create")),
):
    _get_or_404(db, ac_mod.Employees, payload.employee_id, "Employee")

    obj = models.Employee_absences(**payload.model_dump())

    if obj.start_date > obj.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date cannot be after end_date",
        )

    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)

    # TODO: kafka

    return obj


@router.get("/absences", response_model=PaginatedResponse[schemas.EmployeeAbsenceRead])
def list_employee_absences(
    employee_id: int | None = Query(None),
    status_filter: models.AbsenceStatus | None = Query(None, alias="status"),
    start_date: date | None = Query(None),
    limit: int | None = Query(EMPLOYEE_ABSENCE_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("absences:view")),
):
    query = db.query(models.Employee_absences)

    if employee_id is not None:
        query = query.filter(models.Employee_absences.employee_id == employee_id)
    if status_filter is not None:
        query = query.filter(models.Employee_absences.status == status_filter)
    if start_date is not None:
        query = query.filter(models.Employee_absences.end_date >= start_date)

    return paginate(
        query, limit, offset, order_by=models.Employee_absences.created_at.desc()
    )


@router.get("/absences/{absence_id}", response_model=schemas.EmployeeAbsenceRead)
def get_employee_absence(
    absence_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("absence:view")),
):
    return _get_or_404(db, models.Employee_absences, absence_id, "Employee Absence")


@router.patch("/absences/{absence_id}", response_model=schemas.EmployeeAbsenceRead)
def update_employee_absence(
    absence_id: int,
    payload: schemas.EmployeeAbsenceUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("absence:update")),
):
    obj = _get_or_404(db, models.Employee_absences, absence_id, "Employee Absence")
    _apply_patch_or_reject_nulls(obj, payload, nullable_fields={"reason"})

    if obj.start_date > obj.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date cannot be after end_date",
        )

    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)

    # TODO: kafka

    return obj


@router.delete("/absences/{absence_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee_absence(
    absence_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("absence:delete")),
):
    obj = _get_or_404(db, models.Employee_absences, absence_id, "Employee Absence")

    # deleted_event_id = str(obj.event_id)

    db.delete(obj)
    _commit_or_rollback(db)

    # TODO: KAFKA

    return None


@router.get(
    "/session/{session_id}/details", response_model=schemas.CourseDetailResponse
)
async def get_course_session_details(
    session_id: str,
    neo4j_session=Depends(get_neo4j_session),
    _current_user: user_models.Users = Depends(require_permission("schedule:view")),
):
    """
    Fetches detailed information about a specific class session from the Graph Database.
    """
    result = await neo4j_session.run(COURSE_DETAIL_QUERY, session_id=session_id)
    record = await result.single()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session with the provided ID was not found in the graph database.",
        )

    return schemas.CourseDetailResponse(
        courseName=record["course_name"],
        type=_parse_variant(record["class_type"]),  # it will work after merging #155
        time=record["time_range"],
        location=schemas.CourseLocation(
            campus=record["campus"], building=record["building"], room=record["room"]
        ),
        lecturer=record["lecturer"],
        targetAudience=record["audience_list"],
    )


def _get_academic_day_configs(db: Session, start_date: date) -> list[dict]:
    """
    Academic day configs
    :param db: Session
    :param start_date: date
    :return: List of dicts with keys: physical_date (str), academic_day (str), week_number (int)
    """
    end_date = start_date + timedelta(days=4)
    days = (
        db.query(ac_mod.Academic_calendar)
        .filter(
            ac_mod.Academic_calendar.calendar_date >= start_date,
            ac_mod.Academic_calendar.calendar_date <= end_date,
        )
        .all()
    )

    neo_days = {
        1: "Mondays",
        2: "Tuesdays",
        3: "Wednesdays",
        4: "Thursdays",
        5: "Fridays",
        6: "Saturdays",
        7: "Sundays",
    }

    return [
        {
            "physical_date": d.calendar_date.isoformat(),
            "academic_day": neo_days.get(d.academic_day_of_week),
            "week_number": d.week_number,
        }
        for d in days
    ]


def _parse_variant(class_type_str: str | None) -> ClassType:
    if not class_type_str:
        return ClassType.OTHER
    clean_key = class_type_str.upper().replace("-", "")
    mapping = {
        "LECTURE": ClassType.LECTURE,
        "TUTORIALS": ClassType.TUTORIALS,
        "LABORATORY": ClassType.LABORATORY,
        "SEMINAR": ClassType.SEMINAR,
        "OTHER": ClassType.OTHER,
        "ELEARNING": ClassType.ELEARNING,
    }
    return mapping.get(clean_key, ClassType.OTHER)


@router.get("/lecturer-plan", response_model=list[schemas.ScheduleEntry])
async def get_lecturer_plan(
    instructor_id: int = Query(...),
    start_date: date = Query(...),
    unit_id: int | None = Query(None),
    db: Session = Depends(get_db),
    neo4j_session=Depends(get_neo4j_session),
    _current_user: user_models.Users = Depends(require_permission("schedule:view")),
):
    """
    Get lecturer plan for a given week starting from start_date (which must be a Monday). Optionally filter by unit_id.
    :param instructor_id: Instructor ID
    :param start_date: Starting date of the week (must be a Monday)
    :param unit_id: Optional unit ID to filter by
    :param db: Session
    :param neo4j_session: Neo4j session
    :param _current_user: Current user (for permissions)
    :return: List of ScheduleEntry objects representing the lecturer's plan for the week
    """
    if start_date.weekday() != 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must be a Monday.",
        )

    day_configs = _get_academic_day_configs(db, start_date)
    if not day_configs:
        return []

    result = await neo4j_session.run(
        LECTURER_PLAN_ACADEMIC_QUERY,
        instructor_id=instructor_id,
        unit_id=unit_id,
        day_configs=day_configs,
    )
    records = await result.data()

    return [
        schemas.ScheduleEntry(
            id=rec["session_id"],
            title=rec["title"],
            date=date.fromisoformat(rec["physical_date"]),
            startTime=rec["start_time"],
            endTime=rec["end_time"],
            variant=_parse_variant(rec["class_type"]),
        )
        for rec in records
    ]
