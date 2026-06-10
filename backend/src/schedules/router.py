import logging
import uuid
from datetime import timezone, datetime, date, timedelta, time

from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import cast, String, text
from typing import List, Dict, Any

from .schemas import CustomEventRead, CustomEventCreate, CustomEventUpdate
from ..academics.models import Students, Employees
from . import models
from . import schemas
from ..academics import models as ac_mod
from ..common.kafka_client import send_event
from ..common.pagination.pagination import PaginatedResponse, paginate
from ..common.require_permission import (
    require_permission,
    user_has_permission,
)
from ..common.router_utils import (
    _get_or_404,
    _commit_or_rollback,
    _apply_patch_or_reject_nulls,
    apply_search_to_queries,
)
from ..database.database import get_db
from ..database.neo4j import get_neo4j_session
from ..users import models as user_models
from ..courses.models import ClassType
from ..courses import models as course_models

router = APIRouter(prefix="/schedules", tags=["schedules"])

logger = logging.getLogger(__name__)

ACADEMIC_CALENDAR_LIMIT = 100
EMPLOYEE_ABSENCE_LIMIT = 100


# Schedules
SUGGESTION_LIMIT = 50

COURSE_DETAIL_QUERY = """
    MATCH (s:ClassSession {sessionId: $session_id})
    MATCH (s)-[:OF_COURSE]->(c:Course)
    MATCH (s)-[:FOR_GROUP]->(g:Group)

    OPTIONAL MATCH (s)-[:AT_TIME]->(t:TimeSlot)
    OPTIONAL MATCH (s)-[:TAUGHT_BY]->(i:Instructor)
    OPTIONAL MATCH (s)-[:HELD_IN]->(r:Room)-[:IN_BUILDING]->(b:Building)-[:IN_CAMPUS]->(cp:Campus)

    RETURN
        c.courseName AS course_name,
        c.classType AS class_type,
        COALESCE(t.startTime + " - " + t.endTime, "TBA") AS time_range,
        COALESCE(cp.campusShort, "TBA") AS campus,
        COALESCE(b.buildingNumber, "TBA") AS building,
        COALESCE(r.roomName, "TBA") AS room,
        COALESCE((CASE WHEN i.degree IS NOT NULL THEN i.degree + " " ELSE "" END) + i.firstName + " " + i.lastName, "TBA") AS lecturer,
        collect(DISTINCT g.programName + " | " + g.groupName) AS audience_list
"""

LECTURER_PLAN_ACADEMIC_QUERY = """
    MATCH (i:Instructor {instructorId: $instructor_id})
    WHERE ($unit_id IS NULL OR i.unitId = $unit_id)
    WITH i

    UNWIND $day_configs AS config

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

STUDY_FIELD_PLAN_ACADEMIC_QUERY = """
    MATCH (g:Group) WHERE g.groupId IN $group_ids
    WITH collect(g) AS groups

    UNWIND $day_configs AS config
    UNWIND groups AS g

    MATCH (s:ClassSession)-[:FOR_GROUP]->(g)
    MATCH (s)-[:AT_TIME]->(t:TimeSlot {dayOfWeek: config.academic_day})
    MATCH (s)-[:OF_COURSE]->(c:Course)

    WHERE config.week_number IN s.weeks

    WITH DISTINCT s, c, config, t

    RETURN
        s.sessionId AS session_id,
        c.courseName AS title,
        c.classType AS class_type,
        config.physical_date AS physical_date,
        t.startTime AS start_time,
        t.endTime AS end_time
    ORDER BY config.physical_date, t.startTime
"""

ROOM_PLAN_QUERY = """
    MATCH (r:Room {roomId: $room_id})
    MATCH (r)-[:IN_BUILDING]->(b:Building {buildingId: $building_id})-[:IN_CAMPUS]->(c:Campus {campusId: $campus_id})
    WITH r

    UNWIND $day_configs AS config

    MATCH (s:ClassSession)-[:HELD_IN]->(r)
    MATCH (s)-[:AT_TIME]->(t:TimeSlot {dayOfWeek: config.academic_day})
    MATCH (s)-[:OF_COURSE]->(course:Course)

    WHERE config.week_number IN s.weeks

    RETURN
        s.sessionId AS session_id,
        course.courseName AS title,
        course.classType AS class_type,
        config.physical_date AS physical_date,
        t.startTime AS start_time,
        t.endTime AS end_time
    ORDER BY config.physical_date, t.startTime
"""


EMPLOYEE_SCHEDULE_QUERY = """
    MATCH (i:Instructor {instructorId: $instructor_id})
    WITH i

    UNWIND $day_configs AS config

    MATCH (s:ClassSession)-[:TAUGHT_BY]->(i)
    MATCH (s)-[:AT_TIME]->(t:TimeSlot {dayOfWeek: config.academic_day})
    MATCH (s)-[:OF_COURSE]->(course:Course)

    OPTIONAL MATCH (s)-[:HELD_IN]->(r:Room)

    WHERE config.week_number IN s.weeks

    RETURN
        s.sessionId AS session_id,
        course.courseName AS title,
        course.classType AS class_type,
        config.physical_date AS physical_date,
        t.startTime AS start_time,
        t.endTime AS end_time,
        COALESCE(r.roomName, "TBA") AS room_name
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
    search: str | None = Query(
        None, description="Full-text search (reason, source, states)"
    ),
    limit: int = Query(SUGGESTION_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """
    List schedule suggestions with optional filters and search.

    - status_filter: filter by suggestion status
    - source: exact match on source
    - source: case-insensitive substring match on source
    - search: case-insensitive substring search across reason, source and JSON states
    """
    query = db.query(models.ScheduleSuggestion)
    count_query = db.query(models.ScheduleSuggestion.id)

    if status_filter:
        filter_stmt = models.ScheduleSuggestion.status == status_filter
        query = query.filter(filter_stmt)
        count_query = count_query.filter(filter_stmt)

    if source:
        f = models.ScheduleSuggestion.source.ilike(f"%{source}%")
        query = query.filter(f)
        count_query = count_query.filter(f)

    if target_class_session_id:
        f = models.ScheduleSuggestion.target_class_session_id == target_class_session_id
        query = query.filter(f)
        count_query = count_query.filter(f)

    if search:
        columns = [
            models.ScheduleSuggestion.reason,
            models.ScheduleSuggestion.source,
            cast(models.ScheduleSuggestion.state_before, String),
            cast(models.ScheduleSuggestion.state_after, String),
        ]
        query, count_query = apply_search_to_queries(
            search=search, query=query, count_query=count_query, columns=columns
        )

    return paginate(
        query,
        limit,
        offset,
        order_by=models.ScheduleSuggestion.created_at.desc(),
        count_query=count_query,
    )


@router.get(
    "/suggestions/{suggestion_id}", response_model=schemas.ScheduleSuggestionRead
)
def get_schedule_suggestion(suggestion_id: int, db: Session = Depends(get_db)):
    return _get_or_404(
        db, models.ScheduleSuggestion, suggestion_id, "Schedule Suggestion"
    )


@router.patch(
    "/suggestions/{suggestion_id}", response_model=schemas.ScheduleSuggestionRead
)
async def resolve_schedule_suggestion(  # todo: handle tab of class sessions
    suggestion_id: int,
    payload: schemas.ScheduleSuggestionUpdate,
    db: Session = Depends(get_db),
):
    obj = _get_or_404(
        db, models.ScheduleSuggestion, suggestion_id, "Schedule Suggestion"
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
        db, models.ScheduleSuggestion, suggestion_id, "Schedule Suggestion"
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


def _validate_study_field_plan_params(
    start_date: date, specialization_id: int | None, elective_block_id: int | None
) -> None:
    """Validates input parameters for the study field plan endpoint."""
    if start_date.weekday() != 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must be a Monday.",
        )
    if specialization_id is not None and elective_block_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot filter by both specialization and elective block simultaneously.",
        )


def _get_filtered_group_ids(
    db: Session,
    study_field: int,
    semester: int,
    specialization_id: int | None,
    elective_block_id: int | None,
    group_id: int | None,
) -> list[int]:
    """Builds and executes the SQL query to fetch relevant group IDs."""
    sql_query = (
        db.query(ac_mod.Groups.id)
        .join(
            course_models.Study_program,
            ac_mod.Groups.study_program == course_models.Study_program.id,
        )
        .filter(
            ac_mod.Groups.semester == semester,
            course_models.Study_program.study_field == study_field,
        )
    )

    if specialization_id:
        sql_query = sql_query.filter(ac_mod.Groups.major == specialization_id)
    if elective_block_id:
        sql_query = sql_query.filter(ac_mod.Groups.elective_block == elective_block_id)
    if group_id:
        sql_query = sql_query.filter(ac_mod.Groups.id == group_id)

    return [int(row[0]) for row in sql_query.all()]


def _map_schedule_entries(records: list[dict]) -> list[schemas.ScheduleEntry]:
    """Maps Neo4j records to ScheduleEntry Pydantic schemas."""
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


@router.get("/study-field-plan", response_model=list[schemas.ScheduleEntry])
async def get_study_field_plan(
    start_date: date = Query(...),
    study_field: int = Query(...),
    semester: int = Query(..., gt=0),
    specialization_id: int | None = Query(None),
    elective_block_id: int | None = Query(None),
    group_id: int | None = Query(None),
    db: Session = Depends(get_db),
    neo4j_session=Depends(get_neo4j_session),
    _current_user: user_models.Users = Depends(require_permission("schedule:view")),
):
    """
    Get study field plan for a given week starting from start_date (which must be a Monday).
    Optionally filter by specialization, elective block and groups.
    :param start_date: Starting date of the week (must be a Monday)
    :param study_field: Study field ID
    :param semester: Semester number (1 or 2)
    :param specialization_id: Specialization ID (optional)
    :param elective_block_id: Elective block ID (optional)
    :param group_id: Group id to filter by
    :param db: Session
    :param neo4j_session: Neo4j session
    :param _current_user: Current user (for permissions)
    :return: List of ScheduleEntry objects representing the study field's plan for the week
    """
    _validate_study_field_plan_params(start_date, specialization_id, elective_block_id)

    day_configs = _get_academic_day_configs(db, start_date)
    final_group_ids = _get_filtered_group_ids(
        db=db,
        study_field=study_field,
        semester=semester,
        specialization_id=specialization_id,
        elective_block_id=elective_block_id,
        group_id=group_id,
    )

    if not day_configs or not final_group_ids:
        return []

    result = await neo4j_session.run(
        STUDY_FIELD_PLAN_ACADEMIC_QUERY,
        group_ids=final_group_ids,
        day_configs=day_configs,
    )

    return _map_schedule_entries(await result.data())


def _get_student_group_ids(db: Session, student_id: int) -> list[int]:
    """
    Fetches all group IDs that a student belongs to based on the Group_members model.
    """
    records = (
        db.query(ac_mod.Group_members.group)
        .filter(ac_mod.Group_members.student == student_id)
        .all()
    )
    return [int(r[0]) for r in records]


def _get_student_with_user_id(db: Session, user_id: int):
    """Returns the student associated with the given user ID."""

    students = db.query(Students).filter(Students.user_id == user_id).all()
    if not students:
        return None
    if len(students) > 1:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Multiple student records found for the given user_id. "
                "The request is ambiguous and must be disambiguated."
            ),
        )
    return students[0]


def _get_employee_with_user_id(db: Session, user_id: int):
    """Returns the employee associated with the given user ID."""

    employees = db.query(Employees).filter(Employees.user_id == user_id).all()
    if not employees:
        return None
    if len(employees) > 1:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Multiple employee records found for the given user_id. "
                "The request is ambiguous and must be disambiguated."
            ),
        )
    return employees[0]


@router.get("/user-plan", response_model=list[schemas.ScheduleEntry])
async def get_user_plan(
    user_id: int = Query(..., description="ID of the user"),
    start_date: date = Query(
        ...,
        description="Starting date of the week (must be a Monday, format: YYYY-MM-DD)",
    ),
    db: Session = Depends(get_db),
    neo4j_session=Depends(get_neo4j_session),
    _current_user: user_models.Users = Depends(require_permission("schedule:view")),
):
    """
    Get the schedule plan for a specific user for a given week.
    The response covers the entire work week (Monday-Friday).
    """
    if start_date.weekday() != 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must be a Monday.",
        )

    if _current_user.id != user_id and not user_has_permission(
        _current_user, "schedule:view_others"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to view other users' schedules",
        )

    student = _get_student_with_user_id(db, user_id)
    employee = _get_employee_with_user_id(db, user_id)

    if not student and not employee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is neither a student nor an employee",
        )

    day_configs = _get_academic_day_configs(db, start_date)
    if not day_configs:
        return []

    if student:
        group_ids = _get_student_group_ids(db, student.id)

        if not group_ids:
            return []

        result = await neo4j_session.run(
            STUDY_FIELD_PLAN_ACADEMIC_QUERY,
            group_ids=group_ids,
            day_configs=day_configs,
        )

        records = await result.data()
        return _map_schedule_entries(records)

    else:
        # employee
        result = await neo4j_session.run(
            EMPLOYEE_SCHEDULE_QUERY,
            instructor_id=employee.id,
            day_configs=day_configs,
        )

        records = await result.data()
        return _map_schedule_entries(records)


def _map_room_plan(records: list[dict]) -> list[schemas.ScheduleEntry]:
    normalized_records = [{**rec, "title": rec["course_name"]} for rec in records]
    return _map_schedule_entries(normalized_records)


@router.get("/room-plan", response_model=list[schemas.ScheduleEntry])
async def get_room_plan(
    start_date: date = Query(..., description="Must be Monday (YYYY-MM-DD)"),
    campus_id: int = Query(...),
    building_id: int = Query(...),
    room_id: int = Query(...),
    plan_version: str | None = Query(None),
    db: Session = Depends(get_db),
    neo4j_session=Depends(get_neo4j_session),
    _current_user: user_models.Users = Depends(require_permission("schedule:view")),
):
    """
    Returns weekly schedule for a specific room (Mon–Fri).
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
        ROOM_PLAN_QUERY,
        campus_id=campus_id,
        building_id=building_id,
        room_id=room_id,
        plan_version=plan_version,
        day_configs=day_configs,
    )

    records = await result.data()

    return _map_room_plan(records)


_UPDATE_SCHEDULE_QUERY = """
    MATCH (s:ClassSession {sessionId: $session_id})
    MATCH (t:TimeSlot {timeSlotId: $timeslot_id})
    MATCH (r:Room {roomId: $room_id})
    MATCH (i:Instructor {instructorId: $instructor_id})
    
    /* other ClassSession in the same TimeSlot */
    OPTIONAL MATCH (other:ClassSession)-[:AT_TIME]->(t)
    WHERE other.sessionId <> $session_id
    
    OPTIONAL MATCH (other)-[:TAUGHT_BY]->(oi:Instructor)
    OPTIONAL MATCH (other)-[:HELD_IN]->(or:Room)
    
    /* conflict checker */
    WITH s, t, r, i, other,
         collect(
            CASE
                WHEN other IS NULL THEN null
                WHEN oi.instructorId = $instructor_id THEN other
                WHEN or.roomId = $room_id THEN other
                ELSE null
            END
         ) AS conflicts
    
    /* remove NULL vals */
    WITH s, t, r, i,
         [x IN conflicts WHERE x IS NOT NULL] AS conflicts_filtered
    
    WITH s, t, r, i, size(conflicts_filtered) AS conflictCount
    WHERE conflictCount = 0
    
    /* update */
    OPTIONAL MATCH (s)-[old_time:AT_TIME]->(:TimeSlot)
    DELETE old_time
    
    WITH s, t, r, i
    
    OPTIONAL MATCH (s)-[old_room:HELD_IN]->(:Room)
    DELETE old_room
    
    WITH s, t, r, i
    
    OPTIONAL MATCH (s)-[old_instr:TAUGHT_BY]->(:Instructor)
    DELETE old_instr
    
    WITH s, t, r, i
    
    MERGE (s)-[:AT_TIME]->(t)
    MERGE (s)-[:HELD_IN]->(r)
    MERGE (s)-[:TAUGHT_BY]->(i)
    
    RETURN s.sessionId AS sessionId
"""

_FIND_TIMESLOT_QUERY = """
    MATCH (t:TimeSlot)
    WHERE t.dayOfWeek = $dayOfWeek
      AND t.startTime = $startTime
      AND t.endTime = $endTime
    RETURN t.timeSlotId AS timeSlotId
    LIMIT 1
"""


async def update_schedule_atomic(
    session_id: str,
    timeslot_id: int,
    room_id: int,
    instructor_id: int,
    neo4j_session,
) -> bool:
    result = await neo4j_session.run(
        _UPDATE_SCHEDULE_QUERY,
        session_id=session_id,
        timeslot_id=timeslot_id,
        room_id=room_id,
        instructor_id=instructor_id,
    )

    record = await result.single()
    return record is not None


async def _get_timeslot_or_400(
    neo4j_session,
    day_of_week: str,
    start_time: str,
    end_time: str,
) -> int:
    result = await neo4j_session.run(
        _FIND_TIMESLOT_QUERY,
        dayOfWeek=day_of_week,
        startTime=start_time,
        endTime=end_time,
    )

    record = await result.single()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Timeslot not found for {day_of_week} " f"{start_time}-{end_time}"
            ),
        )

    return record["timeSlotId"]


def _to_plural_day(dow: str) -> str:
    mapping = {
        "Monday": "Mondays",
        "Tuesday": "Tuesdays",
        "Wednesday": "Wednesdays",
        "Thursday": "Thursdays",
        "Friday": "Fridays",
        "Saturday": "Saturdays",
        "Sunday": "Sundays",
    }
    return mapping[dow]


@router.put(
    "/session/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def update_schedule_session(
    session_id: str,
    payload: schemas.UpdateScheduleSessionRequest,
    neo4j_session=Depends(get_neo4j_session),
    _current_user: user_models.Users = Depends(require_permission("schedule:update")),
):
    """
    Update a scheduled class session.
    Returns:
    - 204: Session updated successfully.
    - 400: Invalid timeslot.
    - 404: Session not found.
    - 409: Schedule conflict detected.
    """

    mapped_day_of_week = _to_plural_day(payload.day_of_week.value)

    # check session
    result = await neo4j_session.run(
        "MATCH (s:ClassSession {sessionId: $session_id}) RETURN s",
        session_id=session_id,
    )

    if not await result.single():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    # find timeslot
    timeslot_id = await _get_timeslot_or_400(
        neo4j_session=neo4j_session,
        day_of_week=mapped_day_of_week,
        start_time=payload.start_time,
        end_time=payload.end_time,
    )

    # conflict check adn update
    updated = await update_schedule_atomic(
        session_id=session_id,
        timeslot_id=timeslot_id,
        room_id=payload.room_id,
        instructor_id=payload.instructor_id,
        neo4j_session=neo4j_session,
    )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Schedule conflict detected",
        )

    return None


def _week_start_from_date(d: date) -> date:
    return d - timedelta(days=d.weekday())


async def _get_user_week_schedule_for_date(
    db: Session, neo4j_session, user_id: int, reference_date: date
) -> list[schemas.ScheduleEntry]:
    """Returns a list of ScheduleEntry objects for the week containing the reference_date for the specified user_id."""
    week_start = _week_start_from_date(reference_date)
    day_configs = _get_academic_day_configs(db, week_start)
    if not day_configs:
        return []

    student = _get_student_with_user_id(db, user_id)
    employee = _get_employee_with_user_id(db, user_id)

    if student:
        group_ids = _get_student_group_ids(db, student.id)
        if not group_ids:
            return []
        result = await neo4j_session.run(
            STUDY_FIELD_PLAN_ACADEMIC_QUERY,
            group_ids=group_ids,
            day_configs=day_configs,
        )
        records = await result.data()
        return _map_schedule_entries(records)
    elif employee:
        result = await neo4j_session.run(
            EMPLOYEE_SCHEDULE_QUERY, instructor_id=employee.id, day_configs=day_configs
        )
        records = await result.data()
        return _map_schedule_entries(records)
    else:
        return []


def _parse_time_str_to_timeobj(tstr: str) -> time:
    return datetime.strptime(tstr, "%H:%M").time()


def _check_single_overlap(
    rec: schemas.ScheduleEntry, event_start_dt: datetime, event_end_dt: datetime
) -> dict | None:
    """
    Checks if a single schedule entry overlaps with the given time range.
    Returns conflict dictionary if overlap occurs, else None.
    """
    sess_date = rec.date
    if not (event_start_dt.date() <= sess_date <= event_end_dt.date()):
        return None

    sess_start = _parse_time_str_to_timeobj(rec.start_time)
    sess_end = _parse_time_str_to_timeobj(rec.end_time)

    sess_start_dt = datetime.combine(
        sess_date, sess_start, tzinfo=event_start_dt.tzinfo
    )
    sess_end_dt = datetime.combine(sess_date, sess_end, tzinfo=event_start_dt.tzinfo)

    if event_end_dt <= sess_start_dt or event_start_dt >= sess_end_dt:
        return None

    return {
        "session_date": sess_date.isoformat(),
        "session_start": sess_start.strftime("%H:%M"),
        "session_end": sess_end.strftime("%H:%M"),
        "session_title": rec.title,
        "session_id": rec.id,
    }


def _event_overlaps_schedule(
    event_start_dt: datetime,
    event_end_dt: datetime,
    schedule_entries: list[schemas.ScheduleEntry],
) -> list[dict]:
    """
    Checks for overlaps against a list of schedule_entries.
    Returns a list of conflicts (may be empty).
    """
    conflicts = []
    for rec in schedule_entries:
        conflict = _check_single_overlap(rec, event_start_dt, event_end_dt)
        if conflict:
            conflicts.append(conflict)

    return conflicts


CREATE_CUSTOM_EVENT_QUERY = """
MERGE (u:User {userId: $user_id})
CREATE (e:CustomEvent {
    eventId: $event_id,
    title: $title,
    description: $description,
    eventType: $event_type,
    startDt: datetime($start_dt),
    endDt: datetime($end_dt),
    createdAt: datetime($created_at)
})
MERGE (u)-[:CREATED]->(e)

WITH e
OPTIONAL MATCH (r:Room {roomId: $room_id})
FOREACH (_ IN CASE WHEN r IS NOT NULL THEN [1] ELSE [] END | MERGE (e)-[:HELD_IN]->(r))

WITH e
OPTIONAL MATCH (g:Group {groupId: $group_id})
FOREACH (_ IN CASE WHEN g IS NOT NULL THEN [1] ELSE [] END | MERGE (e)-[:RELATED_TO_GROUP]->(g))

WITH e
OPTIONAL MATCH (s:ClassSession {sessionId: $session_id})
FOREACH (_ IN CASE WHEN s IS NOT NULL THEN [1] ELSE [] END | MERGE (e)-[:RELATED_TO_SESSION]->(s))

RETURN e.eventId AS event_id
"""

GET_CUSTOM_EVENTS_QUERY = """
MATCH (u:User {userId: $user_id})-[:CREATED]->(e:CustomEvent)
OPTIONAL MATCH (e)-[:HELD_IN]->(r:Room)
OPTIONAL MATCH (e)-[:RELATED_TO_GROUP]->(g:Group)
OPTIONAL MATCH (e)-[:RELATED_TO_SESSION]->(s:ClassSession)
RETURN e.eventId AS event_id, e.title AS title, e.description AS description, 
       e.eventType AS event_type, toString(e.startDt) AS start_dt, toString(e.endDt) AS end_dt, 
       toString(e.createdAt) AS created_at, toString(e.updatedAt) AS updated_at,
       $user_id AS user_id, u.userId AS created_by,
       r.roomId AS related_room_id, g.groupId AS related_group_id, s.sessionId AS related_session_id
ORDER BY e.startDt DESC
SKIP $skip LIMIT $limit
"""

COUNT_CUSTOM_EVENTS_QUERY = """
MATCH (u:User {userId: $user_id})-[:CREATED]->(e:CustomEvent)
RETURN count(e) AS total
"""

GET_CUSTOM_EVENT_BY_ID_QUERY = """
MATCH (e:CustomEvent {eventId: $event_id})<-[:CREATED]-(u:User)
OPTIONAL MATCH (e)-[:HELD_IN]->(r:Room)
OPTIONAL MATCH (e)-[:RELATED_TO_GROUP]->(g:Group)
OPTIONAL MATCH (e)-[:RELATED_TO_SESSION]->(s:ClassSession)
RETURN e.eventId AS event_id, e.title AS title, e.description AS description, 
       e.eventType AS event_type, toString(e.startDt) AS start_dt, toString(e.endDt) AS end_dt, 
       toString(e.createdAt) AS created_at, toString(e.updatedAt) AS updated_at,
       u.userId AS user_id, u.userId AS created_by,
       r.roomId AS related_room_id, g.groupId AS related_group_id, s.sessionId AS related_session_id
"""

UPDATE_CUSTOM_EVENT_QUERY = """
MATCH (e:CustomEvent {eventId: $event_id})
SET e.title = $title,
    e.description = $description,
    e.eventType = $event_type,
    e.startDt = datetime($start_dt),
    e.endDt = datetime($end_dt),
    e.updatedAt = datetime($updated_at)

WITH e
OPTIONAL MATCH (e)-[old_r:HELD_IN]->(:Room)
DELETE old_r
WITH e
OPTIONAL MATCH (r:Room {roomId: $room_id})
FOREACH (_ IN CASE WHEN r IS NOT NULL THEN [1] ELSE [] END | MERGE (e)-[:HELD_IN]->(r))

WITH e
OPTIONAL MATCH (e)-[old_g:RELATED_TO_GROUP]->(:Group)
DELETE old_g
WITH e
OPTIONAL MATCH (g:Group {groupId: $group_id})
FOREACH (_ IN CASE WHEN g IS NOT NULL THEN [1] ELSE [] END | MERGE (e)-[:RELATED_TO_GROUP]->(g))

WITH e
OPTIONAL MATCH (e)-[old_s:RELATED_TO_SESSION]->(:ClassSession)
DELETE old_s
WITH e
OPTIONAL MATCH (s:ClassSession {sessionId: $session_id})
FOREACH (_ IN CASE WHEN s IS NOT NULL THEN [1] ELSE [] END | MERGE (e)-[:RELATED_TO_SESSION]->(s))

RETURN e.eventId AS event_id
"""

DELETE_CUSTOM_EVENT_QUERY = """
MATCH (e:CustomEvent {eventId: $event_id})
DETACH DELETE e
"""

CHECK_CUSTOM_EVENT_CONFLICTS_QUERY = """
MATCH (e:CustomEvent)
WHERE ((e)<-[:CREATED]-(:User {userId: $user_id}) 
       OR ($room_id IS NOT NULL AND (e)-[:HELD_IN]->(:Room {roomId: $room_id})))
  AND e.startDt < datetime($end_dt) 
  AND e.endDt > datetime($start_dt)
  AND ($exclude_event_id IS NULL OR e.eventId <> $exclude_event_id)
RETURN e.title AS title, toString(e.startDt) AS start_dt, toString(e.endDt) AS end_dt
"""

# --- HELPER FUNCTIONS ---


def _parse_neo4j_dt(dt_str: str | None) -> datetime | None:
    if not dt_str or dt_str == "null":
        return None
    return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))


async def _check_all_conflicts(
    db, neo4j_session, user_id, start_dt, end_dt, room_id, exclude_event_id=None
) -> list[dict]:
    schedule_entries: list[schemas.ScheduleEntry] = []
    week_cursor = _week_start_from_date(start_dt.date())
    end_week = _week_start_from_date(end_dt.date())

    while week_cursor <= end_week:
        schedule_entries.extend(
            await _get_user_week_schedule_for_date(
                db, neo4j_session, user_id, week_cursor
            )
        )
        week_cursor += timedelta(days=7)

    conflicts = _event_overlaps_schedule(start_dt, end_dt, schedule_entries)

    result = await neo4j_session.run(
        CHECK_CUSTOM_EVENT_CONFLICTS_QUERY,
        user_id=user_id,
        room_id=room_id,
        start_dt=start_dt.isoformat(),
        end_dt=end_dt.isoformat(),
        exclude_event_id=str(exclude_event_id) if exclude_event_id else None,
    )
    custom_records = await result.data()
    for rec in custom_records:
        start_obj = _parse_neo4j_dt(rec["start_dt"])
        end_obj = _parse_neo4j_dt(rec["end_dt"])
        conflicts.append(
            {
                "session_date": start_obj.date().isoformat(),
                "session_start": start_obj.strftime("%H:%M"),
                "session_end": end_obj.strftime("%H:%M"),
                "session_title": rec["title"] + " (Custom Event)",
            }
        )

    return conflicts


@router.post(
    "/custom-events",
    response_model=CustomEventRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_custom_event(
    payload: CustomEventCreate,
    db: Session = Depends(get_db),
    neo4j_session=Depends(get_neo4j_session),
    _current_user: user_models.Users = Depends(
        require_permission("custom-events:create")
    ),
):
    conflicts = await _check_all_conflicts(
        db,
        neo4j_session,
        payload.user_id,
        payload.start_dt,
        payload.end_dt,
        payload.related_room_id,
    )

    if conflicts:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "Event conflicts with existing scheduled sessions or custom events",
                "conflicts": conflicts,
            },
        )

    event_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    await neo4j_session.run(
        CREATE_CUSTOM_EVENT_QUERY,
        user_id=payload.user_id,
        event_id=event_id,
        title=payload.title,
        description=payload.description,
        event_type=payload.event_type.value,
        start_dt=payload.start_dt.isoformat(),
        end_dt=payload.end_dt.isoformat(),
        created_at=now.isoformat(),
        room_id=payload.related_room_id,
        group_id=payload.related_group_id,
        session_id=(
            str(payload.related_session_id) if payload.related_session_id else None
        ),
    )

    return await get_custom_event(
        event_id, neo4j_session, _current_user, bypass_permission=True
    )


@router.get("/custom-events", response_model=PaginatedResponse[CustomEventRead])
async def list_custom_events(
    user_id: int | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    neo4j_session=Depends(get_neo4j_session),
    _current_user: user_models.Users = Depends(
        require_permission("custom-events:view")
    ),
):
    is_privileged = user_has_permission(_current_user, "custom-events:create")

    if not is_privileged:
        if user_id is not None and user_id != _current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own custom events.",
            )
        user_id = _current_user.id

    count_res = await neo4j_session.run(COUNT_CUSTOM_EVENTS_QUERY, user_id=user_id)
    total_record = await count_res.single()
    total = total_record["total"] if total_record else 0

    result = await neo4j_session.run(
        GET_CUSTOM_EVENTS_QUERY, user_id=user_id, skip=offset, limit=limit
    )
    records = await result.data()

    items = [
        CustomEventRead(
            event_id=rec["event_id"],
            user_id=rec["user_id"],
            title=rec["title"],
            description=rec["description"],
            event_type=rec["event_type"],
            start_dt=_parse_neo4j_dt(rec["start_dt"]),
            end_dt=_parse_neo4j_dt(rec["end_dt"]),
            related_room_id=rec["related_room_id"],
            related_group_id=rec["related_group_id"],
            related_session_id=rec["related_session_id"],
            created_by=rec["created_by"],
            created_at=_parse_neo4j_dt(rec["created_at"]),
            updated_at=_parse_neo4j_dt(rec["updated_at"]),
        )
        for rec in records
    ]

    return {
        "items": items,
        "total": total,
        "page": (offset // limit) + 1,
        "size": limit,
        "pages": (total + limit - 1) // limit,
    }


@router.get("/custom-events/{custom_event_id}", response_model=CustomEventRead)
async def get_custom_event(
    custom_event_id: str,
    neo4j_session=Depends(get_neo4j_session),
    _current_user: user_models.Users = Depends(
        require_permission("custom-events:view")
    ),
    bypass_permission: bool = False,
):
    result = await neo4j_session.run(
        GET_CUSTOM_EVENT_BY_ID_QUERY, event_id=custom_event_id
    )
    record = await result.single()

    if not record:
        raise HTTPException(status_code=404, detail="Custom Event not found")

    if not bypass_permission:
        is_privileged = user_has_permission(_current_user, "custom-events:create")
        if not is_privileged and record["user_id"] != _current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own custom events.",
            )

    return CustomEventRead(
        event_id=record["event_id"],
        user_id=record["user_id"],
        title=record["title"],
        description=record["description"],
        event_type=record["event_type"],
        start_dt=_parse_neo4j_dt(record["start_dt"]),
        end_dt=_parse_neo4j_dt(record["end_dt"]),
        related_room_id=record["related_room_id"],
        related_group_id=record["related_group_id"],
        related_session_id=record["related_session_id"],
        created_by=record["created_by"],
        created_at=_parse_neo4j_dt(record["created_at"]),
        updated_at=_parse_neo4j_dt(record["updated_at"]),
    )


def _prepare_update_params(
    event_id: str, existing: CustomEventRead, payload: CustomEventUpdate
) -> dict:
    """Merges existing event data with the update payload to produce Neo4j parameters."""
    merged = existing.model_dump()
    merged.update(payload.model_dump(exclude_unset=True))

    e_type = merged["event_type"]

    return {
        "event_id": event_id,
        "title": merged["title"],
        "description": merged["description"],
        "event_type": e_type.value if hasattr(e_type, "value") else e_type,
        "start_dt": merged["start_dt"],
        "end_dt": merged["end_dt"],
        "room_id": merged["related_room_id"],
        "group_id": merged["related_group_id"],
        "session_id": (
            str(merged["related_session_id"]) if merged["related_session_id"] else None
        ),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.patch("/custom-events/{custom_event_id}", response_model=CustomEventRead)
async def update_custom_event(
    custom_event_id: str,
    payload: CustomEventUpdate,
    db: Session = Depends(get_db),
    neo4j_session=Depends(get_neo4j_session),
    _current_user: user_models.Users = Depends(
        require_permission("custom-events:update")
    ),
):
    existing = await get_custom_event(custom_event_id, neo4j_session, _current_user)
    params = _prepare_update_params(custom_event_id, existing, payload)

    updates = payload.model_dump(exclude_unset=True)
    if any(k in updates for k in ("start_dt", "end_dt", "related_room_id")):
        conflicts = await _check_all_conflicts(
            db,
            neo4j_session,
            existing.user_id,
            params["start_dt"],
            params["end_dt"],
            params["room_id"],
            exclude_event_id=custom_event_id,
        )
        if conflicts:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": "Updated event conflicts with existing sessions or custom events",
                    "conflicts": conflicts,
                },
            )

    params["start_dt"] = params["start_dt"].isoformat()
    params["end_dt"] = params["end_dt"].isoformat()

    await neo4j_session.run(UPDATE_CUSTOM_EVENT_QUERY, **params)

    return await get_custom_event(
        custom_event_id, neo4j_session, _current_user, bypass_permission=True
    )


@router.delete(
    "/custom-events/{custom_event_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_custom_event(
    custom_event_id: str,
    neo4j_session=Depends(get_neo4j_session),
    _current_user: user_models.Users = Depends(
        require_permission("custom-events:delete")
    ),
):
    await get_custom_event(custom_event_id, neo4j_session, _current_user)

    await neo4j_session.run(DELETE_CUSTOM_EVENT_QUERY, event_id=custom_event_id)
    return None


GROUP_COURSE_HOURS_SUMMARY_QUERY = """
        MATCH (g:Group {groupId: $group_id})
              <-[:FOR_GROUP]-(s:ClassSession)
              -[:OF_COURSE]->(c:Course)

        OPTIONAL MATCH (s)-[:AT_TIME]->(t:TimeSlot)

        WITH
            c.courseCode AS course_code,
            c.courseName AS course_name,
            c.classType AS class_type,
            s,
            count(t) AS slot_count

        RETURN
            course_code,
            course_name,
            class_type,
            sum(slot_count * size(s.weeks)) AS total_slots
        ORDER BY course_name, class_type
    """


def _get_group_course_type_details(session: Session, group_id: int):
    """
    Return course type details for all courses assigned to the specified group.
    """
    query = text("""
        SELECT
            ctd.course,
            c.course_name,
            ctd.class_type,
            ctd.class_hours
        FROM groups g
        JOIN curriculum_courses cc
            ON cc.study_program = g.study_program
        JOIN courses c
            ON c.course_code = cc.course
        JOIN course_type_detail ctd
            ON ctd.course = cc.course
        WHERE g.id = :group_id
          AND cc.semester = g.semester
          AND cc.elective_block IS NOT DISTINCT FROM g.elective_block
          AND cc.major IS NOT DISTINCT FROM g.major
        ORDER BY c.course_name
    """)

    return session.execute(query, {"group_id": group_id}).mappings().all()


def _detect_extra_neo4j_entries(
    group_id: int,
    neo4j_map: Dict[tuple, Dict[str, Any]],
    postgres_map: Dict[tuple, Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Detect entries that exist in Neo4j but are missing in Postgres.
    """
    extras = []

    for key, neo in neo4j_map.items():
        if key not in postgres_map:
            extras.append(
                {
                    "group_id": group_id,
                    "course_code": neo["course_code"],
                    "course_name": neo["course_name"],
                    "class_type": neo["class_type"],
                    "neo4j_slots": neo["total_slots"],
                    "postgres_hours": None,
                    "match": False,
                    "extra_in_neo4j": True,
                    "difference": None,
                }
            )

    return extras


def compare_neo4j_with_postgres(
    result: List,
    group_id: int,
    neo4j_data: List[Dict[str, Any]],
    postgres_data: List[Dict[str, Any]],
) -> None:
    """
    - detects missing courses in Neo4j
    - detects mismatches
    """

    neo4j_map = {
        (n["course_code"], str(n["class_type"]).lower()): n for n in neo4j_data
    }

    postgres_map = {
        (p["course"], str(p["class_type"]).lower()): p for p in postgres_data
    }

    for key, pg in postgres_map.items():
        neo = neo4j_map.get(key)

        if neo is None:
            # course exists in postgres but is missing in neo4j
            result.append(
                {
                    "group_id": group_id,
                    "course_code": pg["course"],
                    "course_name": pg["course_name"],
                    "class_type": pg["class_type"],
                    "neo4j_slots": 0,
                    "postgres_hours": pg["class_hours"],
                    "match": False,
                    "missing_in_neo4j": True,
                    "difference": -pg["class_hours"],
                }
            )
            continue

        match = neo["total_slots"] == pg["class_hours"]
        # hours mismatch
        if not match:
            result.append(
                {
                    "group_id": group_id,
                    "course_code": pg["course"],
                    "course_name": pg["course_name"],
                    "class_type": pg["class_type"],
                    "neo4j_slots": neo["total_slots"],
                    "postgres_hours": pg["class_hours"],
                    "match": match,
                    "missing_in_neo4j": False,
                    "difference": neo["total_slots"] - pg["class_hours"],
                }
            )

    # detect extra Neo4j entries
    result.extend(_detect_extra_neo4j_entries(group_id, neo4j_map, postgres_map))


def _group_exists(db: Session, group_id: str) -> int:
    """
    Checks if given group exists in postgres
    """
    group_exists_query = text("""
            SELECT 1
            FROM groups
            WHERE id = :group_id
            LIMIT 1
        """)

    try:
        group_id_int = int(group_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect group_id param",
        )

    group_exists = db.execute(group_exists_query, {"group_id": group_id_int}).scalar()

    if group_exists is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group {group_id} not found",
        )
    if not group_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group {group_id} not found",
        )

    return group_id_int


def _get_all_active_groups(session: Session) -> List[int]:
    """
    Returns a list of IDs of all active groups.
    """
    query = text("""
        select id from groups where is_active = true
    """)

    result = session.execute(query)
    return [row[0] for row in result.fetchall()]


@router.get("/validate-plan", status_code=status.HTTP_200_OK)
async def validate_group_plan(
    neo4j_session=Depends(get_neo4j_session),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("schedule:view")),
):
    """
    Validates timetables for all active groups by comparing teaching hours
    stored in Neo4j against curriculum requirements defined in PostgreSQL.
    """
    active_groups = _get_all_active_groups(db)
    validation_result = []
    for ag_id in active_groups:
        # get group data from neo
        result = await neo4j_session.run(
            GROUP_COURSE_HOURS_SUMMARY_QUERY, group_id=ag_id
        )
        group_hours_summary_neo = await result.data()

        # get group data from postgres
        group_hours_summary_postgres = _get_group_course_type_details(db, ag_id)

        # compare data
        compare_neo4j_with_postgres(
            validation_result,
            ag_id,
            group_hours_summary_neo,
            group_hours_summary_postgres,
        )

    if not validation_result:
        return {"valid": True, "message": "Plan is valid", "issues": []}

    return {
        "valid": False,
        "message": f"Found {len(validation_result)} issues",
        "issues": validation_result,
    }
