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
)
from .. import models, schemas
from ...database.database import get_db
from ...common.require_permission import require_permission
from ...users import models as user_models

router = APIRouter(tags=["academics - calendar"])

ACADEMIC_CALENDAR_LIMIT = 100


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
