import pytest
from pydantic import ValidationError
from src.academics.schemas import GroupsCreate, AcademicCalendarCreate
from src.academics.router import _check_for_payload_duplicates
from fastapi import HTTPException
from datetime import date
import pytest


def test_group_schema_logic_error():
    with pytest.raises(ValidationError) as exc:
        GroupsCreate(
            group_name="Test Group", study_program=1, major=10, elective_block=20
        )
    assert "`major` and `elective_block` cannot be set at the same time" in str(
        exc.value
    )


def test_group_schema_logic_success():
    group = GroupsCreate(
        group_name="Test Group", study_program=1, major=10, elective_block=None
    )
    assert group.group_name == "Test Group"


def test_calendar_week_number_out_of_range():
    with pytest.raises(ValidationError):
        AcademicCalendarCreate(
            calendar_date="2026-04-08",
            academic_year="2025/2026",
            semester_type="Winter",
            week_number=21,
            academic_day_of_week=1,
        )


def test_check_for_payload_duplicates_raises_error():
    dates = [date(2026, 4, 8), date(2026, 4, 8)]
    with pytest.raises(HTTPException) as exc:
        _check_for_payload_duplicates(dates)
    assert exc.value.status_code == 400
    assert "Payload contains duplicate dates" in exc.value.detail


def test_check_for_payload_duplicates_success():
    dates = [date(2026, 4, 8), date(2026, 4, 9)]
    _check_for_payload_duplicates(dates)
