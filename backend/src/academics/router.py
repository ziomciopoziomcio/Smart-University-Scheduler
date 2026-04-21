from datetime import date
from typing import List

from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlalchemy.orm import Session

from src.common.pagination.pagination import paginate
from src.common.pagination.pagination_model import PaginatedResponse
from src.common.router_utils import (
    _get_or_404,
    _commit_or_rollback,
    _apply_patch_or_reject_nulls,
    _get_by_fields_or_404,
    serialize_student_nested,
    serialize_employee_nested,
)
from . import models, schemas
from ..database.database import get_db
from ..common.require_permission import require_permission
from ..users import models as user_models
from ..courses import models as course_models
from ..facilities import models as facilities_models

router = APIRouter(prefix="/academics", tags=["academics"])

STUDENT_LIMIT = 100
EMPLOYEE_LIMIT = 100
UNIT_LIMIT = 100
GROUP_LIMIT = 100
GROUP_MEMBER_LIMIT = 100
ACADEMIC_CALENDAR_LIMIT = 100


# Students
@router.post(
    "/students", response_model=schemas.StudentRead, status_code=status.HTTP_201_CREATED
)
def create_student(
    payload: schemas.StudentCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("student:create")),
):
    obj = models.Students(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/students", response_model=PaginatedResponse[schemas.StudentNested])
def list_students(
    user_id: int | None = Query(None),
    study_program: int | None = Query(None),
    major: int | None = Query(None),
    limit: int = Query(STUDENT_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("students:view")),
):
    filters = []
    if user_id is not None:
        filters.append(models.Students.user_id == user_id)
    if study_program is not None:
        filters.append(models.Students.study_program == study_program)
    if major is not None:
        filters.append(models.Students.major == major)

    count_q = db.query(models.Students)
    if filters:
        count_q = count_q.filter(*filters)

    joined_q = (
        db.query(
            models.Students,
            user_models.Users,
            course_models.Study_program,
            course_models.Study_fields,
            course_models.Major,
        )
        .join(user_models.Users, models.Students.user_id == user_models.Users.id)
        .join(
            course_models.Study_program,
            models.Students.study_program == course_models.Study_program.id,
        )
        .join(
            course_models.Study_fields,
            course_models.Study_program.study_field == course_models.Study_fields.id,
        )
        .outerjoin(course_models.Major, models.Students.major == course_models.Major.id)
    )
    if filters:
        joined_q = joined_q.filter(*filters)

    paginated = paginate(
        joined_q,
        limit=limit,
        offset=offset,
        order_by=models.Students.id,
        count_query=count_q,
    )

    rows = paginated.items
    total = paginated.total

    items = [serialize_student_nested(row) for row in rows]
    return PaginatedResponse(items=items, total=total, limit=limit, offset=offset)


@router.get("/students/{student_id}", response_model=schemas.StudentNested)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("student:view")),
):
    row = (
        db.query(
            models.Students,
            user_models.Users,
            course_models.Study_program,
            course_models.Study_fields,
            course_models.Major,
        )
        .join(user_models.Users, models.Students.user_id == user_models.Users.id)
        .join(
            course_models.Study_program,
            models.Students.study_program == course_models.Study_program.id,
        )
        .join(
            course_models.Study_fields,
            course_models.Study_program.study_field == course_models.Study_fields.id,
        )
        .outerjoin(course_models.Major, models.Students.major == course_models.Major.id)
        .filter(models.Students.id == student_id)
        .one_or_none()
    )
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student not found"
        )

    return serialize_student_nested(row)


@router.patch("/students/{student_id}", response_model=schemas.StudentRead)
def update_student(
    student_id: int,
    payload: schemas.StudentUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("student:update")),
):
    obj = _get_or_404(db, models.Students, student_id, "Student")
    _apply_patch_or_reject_nulls(obj, payload, nullable_fields={"major"})
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("student:delete")),
):
    obj = _get_or_404(db, models.Students, student_id, "Student")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Employees
@router.post(
    "/employees",
    response_model=schemas.EmployeeRead,
    status_code=status.HTTP_201_CREATED,
)
def create_employee(
    payload: schemas.EmployeeCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("employee:create")),
):
    obj = models.Employees(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/employees", response_model=PaginatedResponse[schemas.EmployeeNested])
def list_employees(
    user_id: int | None = Query(None),
    faculty_id: int | None = Query(None),
    unit_id: int | None = Query(None),
    limit: int | None = Query(EMPLOYEE_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("employees:view")),
):
    filters = []
    if user_id is not None:
        filters.append(models.Employees.user_id == user_id)
    if faculty_id is not None:
        filters.append(models.Employees.faculty_id == faculty_id)
    if unit_id is not None:
        filters.append(models.Employees.unit_id == unit_id)

    count_q = db.query(models.Employees)
    if filters:
        count_q = count_q.filter(*filters)

    joined_q = (
        db.query(
            models.Employees,
            user_models.Users,
            models.Units,
            facilities_models.Faculty,
        )
        .join(user_models.Users, models.Employees.user_id == user_models.Users.id)
        .outerjoin(models.Units, models.Employees.unit_id == models.Units.id)
        .outerjoin(
            facilities_models.Faculty,
            models.Employees.faculty_id == facilities_models.Faculty.id,
        )
    )
    if filters:
        joined_q = joined_q.filter(*filters)

    paginated = paginate(
        joined_q,
        limit=limit,
        offset=offset,
        order_by=models.Employees.id,
        count_query=count_q,
    )

    rows = paginated.items
    total = paginated.total

    items = [serialize_employee_nested(row) for row in rows]
    return PaginatedResponse(items=items, total=total, limit=limit, offset=offset)


@router.get("/employees/{employee_id}", response_model=schemas.EmployeeNested)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("employee:view")),
):
    row = (
        db.query(
            models.Employees,
            user_models.Users,
            models.Units,
            facilities_models.Faculty,
        )
        .join(user_models.Users, models.Employees.user_id == user_models.Users.id)
        .outerjoin(models.Units, models.Employees.unit_id == models.Units.id)
        .outerjoin(
            facilities_models.Faculty,
            models.Employees.faculty_id == facilities_models.Faculty.id,
        )
        .filter(models.Employees.id == employee_id)
        .one_or_none()
    )
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
        )

    return serialize_employee_nested(row)


@router.patch("/employees/{employee_id}", response_model=schemas.EmployeeRead)
def update_employee(
    employee_id: int,
    payload: schemas.EmployeeUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("employee:update")),
):
    obj = _get_or_404(db, models.Employees, employee_id, "Employee")
    _apply_patch_or_reject_nulls(obj, payload)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/employees/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("employee:delete")),
):
    obj = _get_or_404(db, models.Employees, employee_id, "Employee")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Units
@router.post(
    "/units", response_model=schemas.UnitsRead, status_code=status.HTTP_201_CREATED
)
def create_unit(
    payload: schemas.UnitsCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("unit:create")),
):
    obj = models.Units(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/units", response_model=PaginatedResponse[schemas.UnitsRead])
def list_units(
    faculty_id: int | None = Query(None),
    unit_name: str | None = Query(None, min_length=1),
    unit_short: str | None = Query(None, min_length=1),
    limit: int | None = Query(UNIT_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("units:view")),
):
    query = db.query(models.Units)

    if faculty_id is not None:
        query = query.filter(models.Units.faculty_id == faculty_id)
    if unit_name is not None:
        query = query.filter(models.Units.unit_name.ilike(f"%{unit_name}%"))
    if unit_short is not None:
        query = query.filter(models.Units.unit_short.ilike(f"%{unit_short}%"))

    return paginate(query, limit, offset, models.Units.id)


@router.get("/units/{unit_id}", response_model=schemas.UnitsRead)
def get_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("unit:view")),
):
    return _get_or_404(db, models.Units, unit_id, "Unit")


@router.patch("/units/{unit_id}", response_model=schemas.UnitsRead)
def update_unit(
    unit_id: int,
    payload: schemas.UnitsUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("unit:update")),
):
    obj = _get_or_404(db, models.Units, unit_id, "Unit")
    _apply_patch_or_reject_nulls(obj, payload)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/units/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("unit:delete")),
):
    obj = _get_or_404(db, models.Units, unit_id, "Unit")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Groups
@router.post(
    "/groups", response_model=schemas.GroupsRead, status_code=status.HTTP_201_CREATED
)
def create_group(
    payload: schemas.GroupsCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("group:create")),
):
    obj = models.Groups(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/groups", response_model=PaginatedResponse[schemas.GroupsRead])
def list_groups(
    study_program: int | None = Query(None),
    major: int | None = Query(None),
    elective_block: int | None = Query(None),
    group_name: str | None = Query(None, min_length=1),
    limit: int | None = Query(GROUP_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("groups:view")),
):
    query = db.query(models.Groups)

    if study_program is not None:
        query = query.filter(models.Groups.study_program == study_program)
    if major is not None:
        query = query.filter(models.Groups.major == major)
    if elective_block is not None:
        query = query.filter(models.Groups.elective_block == elective_block)
    if group_name is not None:
        query = query.filter(models.Groups.group_name.ilike(f"%{group_name}%"))

    return paginate(query, limit, offset, models.Groups.id)


@router.get("/groups/summary", response_model=list[schemas.StudyPlanGroupSummary])
def get_study_plan_groups_summary(
    faculty_id: int = Query(...),
    study_field: int = Query(...),
    semester: int = Query(..., gt=0),
    specialization_id: int | None = Query(None),
    elective_block_id: int | None = Query(None),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("groups:view")),
):
    """
    Get study plan groups summary
    :param faculty_id: ID of faculty
    :param study_field: ID of study field
    :param semester: ID of semester
    :param specialization_id: ID of specialization (optional)
    :param elective_block_id: ID of elective block (optional)
    :param db: Session
    :param _current_user: Current user
    :return: List of study plan groups summary
    """
    if specialization_id is not None and elective_block_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot filter by both specialization and elective block",
        )
    query = (
        db.query(models.Groups, course_models.Study_program)
        .join(
            course_models.Study_program,
            models.Groups.study_program == course_models.Study_program.id,
        )
        .join(
            course_models.Study_fields,
            course_models.Study_program.study_field == course_models.Study_fields.id,
        )
    )
    query = query.filter(course_models.Study_fields.faculty == faculty_id)
    query = query.filter(course_models.Study_fields.id == study_field)

    if specialization_id is not None:
        query = query.filter(models.Groups.major == specialization_id)
    if elective_block_id is not None:
        query = query.filter(models.Groups.elective_block == elective_block_id)

    rows = query.limit(1000).all()

    results = []
    for group, study_prog in rows:
        academic_year = f"{study_prog.start_year}/{study_prog.start_year + 1}"
        results.append(
            schemas.StudyPlanGroupSummary(
                id=group.id,
                group_name=group.group_name,
                academic_year=academic_year,
            )
        )
    return results


@router.get("/groups/{group_id}", response_model=schemas.GroupsRead)
def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("group:view")),
):
    return _get_or_404(db, models.Groups, group_id, "Group")


@router.patch("/groups/{group_id}", response_model=schemas.GroupsRead)
def update_group(
    group_id: int,
    payload: schemas.GroupsUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("group:update")),
):
    obj = _get_or_404(db, models.Groups, group_id, "Group")
    _apply_patch_or_reject_nulls(
        obj, payload, nullable_fields={"major", "elective_block"}
    )

    if obj.major is not None and obj.elective_block is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="`major` and `elective_block` cannot both be set",
        )
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("group:delete")),
):
    obj = _get_or_404(db, models.Groups, group_id, "Group")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Group Members
@router.post(
    "/group-members",
    response_model=schemas.GroupMembersRead,
    status_code=status.HTTP_201_CREATED,
)
def create_group_member(
    payload: schemas.GroupMembersCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("group-member:create")
    ),
):
    obj = models.Group_members(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get(
    "/group-members",
    response_model=PaginatedResponse[schemas.GroupMembersRead],
)
def list_group_members(
    group: int | None = Query(None),
    student: int | None = Query(None),
    limit: int | None = Query(GROUP_MEMBER_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("group-members:view")
    ),
):
    query = db.query(models.Group_members)

    if group is not None:
        query = query.filter(models.Group_members.group == group)
    if student is not None:
        query = query.filter(models.Group_members.student == student)

    query = query.order_by(
        models.Group_members.group,
        models.Group_members.student,
    )

    return paginate(
        query,
        limit,
        offset,
        order_by=[models.Group_members.group, models.Group_members.student],
    )


@router.get(
    "/group-members/{group_id}/{student_id}", response_model=schemas.GroupMembersRead
)
def get_group_member(
    group_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("group-member:view")),
):
    return _get_by_fields_or_404(
        db,
        models.Group_members,
        "Group Member",
        group=group_id,
        student=student_id,
    )


@router.patch(
    "/group-members/{group_id}/{student_id}", response_model=schemas.GroupMembersRead
)
def update_group_member(
    group_id: int,
    student_id: int,
    payload: schemas.GroupMembersUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("group-member:update")
    ),
):
    obj = _get_by_fields_or_404(
        db,
        models.Group_members,
        "Group Member",
        group=group_id,
        student=student_id,
    )
    _apply_patch_or_reject_nulls(obj, payload)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete(
    "/group-members/{group_id}/{student_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_group_member(
    group_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("group-member:delete")
    ),
):
    obj = _get_by_fields_or_404(
        db,
        models.Group_members,
        "Group Member",
        group=group_id,
        student=student_id,
    )
    db.delete(obj)
    _commit_or_rollback(db)
    return None


def _check_for_payload_duplicates(dates: list[date]) -> None:
    """Helper to check if the incoming payload has duplicate dates."""
    if len(dates) != len(set(dates)):
        seen = set()
        duplicated = {str(d) for d in dates if d in seen or seen.add(d)}
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payload contains duplicate dates {', '.join(duplicated)}.",
        )


def _check_for_existing_dates_in_db(db: Session, dates: list[date]) -> None:
    """Helper to check if any of the dates already exist in the database."""
    existing_dates = (
        db.query(models.Academic_calendar.calendar_date)
        .filter(models.Academic_calendar.calendar_date.in_(dates))
        .all()
    )
    if existing_dates:
        existing_str = ", ".join([str(d[0]) for d in existing_dates])
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Calendar date {existing_str} already exists.",
        )


@router.post(
    "/calendar/bulk",
    response_model=List[schemas.AcademicCalendarRead],
    status_code=status.HTTP_201_CREATED,
)
def create_bulk_calendar_days(
    payload: list[schemas.AcademicCalendarCreate],
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("calendar-bulk:create")
    ),
):
    """
    Creates multiple calendar days in bulk.
    :param payload: List of calendar day creation payloads.
    :param db: database session.
    :param _current_user: Currently authenticated user.
    :return: created calendar days.
    """
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payload list cannot be empty.",
        )
    dates_to_insert = [item.calendar_date for item in payload]

    _check_for_payload_duplicates(dates_to_insert)
    _check_for_existing_dates_in_db(db, dates_to_insert)

    new_days = [models.Academic_calendar(**item.model_dump()) for item in payload]
    db.add_all(new_days)
    _commit_or_rollback(db)

    return new_days


@router.post(
    "/calendar",
    response_model=schemas.AcademicCalendarRead,
    status_code=status.HTTP_201_CREATED,
)
def create_calendar_day(
    payload: schemas.AcademicCalendarCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("calendar-day:create")
    ),
):
    """
    Creates calendar day.
    :param payload: Calendar day creation payload.
    :param db: database session.
    :param _current_user: Currently authenticated user.
    :return: created calendar day.
    """
    existing = (
        db.query(models.Academic_calendar)
        .filter_by(calendar_date=payload.calendar_date)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Calendar date {existing.calendar_date} already exists.",
        )
    obj = models.Academic_calendar(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get(
    "/calendar",
    response_model=PaginatedResponse[schemas.AcademicCalendarRead],
)
def list_calendar_days(
    academic_year: str | None = Query(None, min_length=1),
    semester_type: models.SemesterType | None = Query(None),
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    limit: int | None = Query(ACADEMIC_CALENDAR_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("calendar-days:view")
    ),
):
    """
    Lists calendar days with optional filtering by academic year, semester type, and date range.
    :param academic_year: Filter by academic year (e.g., "2025/2026").
    :param semester_type: Filter by semester type (e.g., "Winter" or "Summer").
    :param start_date: Filter for calendar days on or after this date.
    :param end_date: Filter for calendar days on or before this date.
    :param limit: Maximum number of calendar days to return (default: 100, max: 200).
    :param offset: Number of calendar days to skip for pagination (default: 0).
    :param db: Database session.
    :param _current_user: Currently authenticated user.
    :return: Paginated list of calendar days matching the filters.
    """
    query = db.query(models.Academic_calendar)
    if academic_year:
        query = query.filter(models.Academic_calendar.academic_year == academic_year)
    if semester_type:
        query = query.filter(models.Academic_calendar.semester_type == semester_type)
    if start_date:
        query = query.filter(models.Academic_calendar.calendar_date >= start_date)
    if end_date:
        query = query.filter(models.Academic_calendar.calendar_date <= end_date)

    return paginate(
        query, limit, offset, order_by=models.Academic_calendar.calendar_date.asc()
    )


@router.get("/calendar/{calendar_date}", response_model=schemas.AcademicCalendarRead)
def get_calendar_day(
    calendar_date: date,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("calendar-day:view")),
):
    """
    Gets calendar day.
    :param calendar_date: Date of the calendar day to retrieve.
    :param db: Database session.
    :param _current_user: Currently authenticated user.
    :return: Calendar day matching the provided date.
    """
    return _get_or_404(db, models.Academic_calendar, calendar_date, "Calendar day")


@router.patch("/calendar/{calendar_date}", response_model=schemas.AcademicCalendarRead)
def update_calendar_day(
    calendar_date: date,
    payload: schemas.AcademicCalendarUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("calendar-day:update")
    ),
):
    """
    Updates calendar day.
    :param calendar_date: Date of the calendar day to update.
    :param payload: Calendar day update payload.
    :param db: Database session.
    :param _current_user: Currently authenticated user.
    :return: Updated calendar day.
    """
    obj = _get_or_404(db, models.Academic_calendar, calendar_date, "Calendar day")
    _apply_patch_or_reject_nulls(obj, payload, nullable_fields={"description"})
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/calendar/{calendar_date}", status_code=status.HTTP_204_NO_CONTENT)
def delete_calendar_day(
    calendar_date: date,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("calendar-day:delete")
    ),
):
    """
    Deletes calendar day.
    :param calendar_date: Date of the calendar day to delete.
    :param db: Database session.
    :param _current_user: Currently authenticated user.
    :return: None
    """
    obj = _get_or_404(db, models.Academic_calendar, calendar_date, "Calendar day")
    db.delete(obj)
    _commit_or_rollback(db)
    return None
