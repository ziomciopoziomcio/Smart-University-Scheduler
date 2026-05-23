import logging
import uuid
from datetime import timezone, datetime, date, timedelta

from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import cast, String

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
async def resolve_schedule_suggestion(
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

    # check session
    result = await neo4j_session.run(
        "MATCH (s:ClassSession {sessionId: $session_id}) RETURN s",
        session_id=session_id,
    )
    record = await result.single()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    # find timeslot
    result = await neo4j_session.run(
        _FIND_TIMESLOT_QUERY,
        dayOfWeek=payload.day_of_week.value,
        startTime=payload.start_time,
        endTime=payload.end_time,
    )

    record = await result.single()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Timeslot not found for "
                f"{payload.day_of_week.value} "
                f"{payload.start_time}-{payload.end_time}"
            ),
        )

    timeslot_id = record["timeSlotId"]

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
