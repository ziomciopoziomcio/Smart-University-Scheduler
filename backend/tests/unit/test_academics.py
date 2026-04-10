import pytest
from datetime import date
from pydantic import ValidationError
from fastapi import HTTPException

from src.academics.schemas import GroupsCreate, GroupsUpdate, AcademicCalendarCreate
from src.academics.router import _check_for_payload_duplicates
from src.academics.models import SemesterType


# ==========================================
# TESTS: Groups (Complex validation)
# ==========================================


def test_group_schema_logic_error():
    """Tests if the validator raises an error when BOTH major and elective_block are provided."""
    with pytest.raises(ValidationError) as exc:
        GroupsCreate(
            group_name="Test Group", study_program=1, major=10, elective_block=20
        )
    assert "`major` and `elective_block` cannot be set at the same time" in str(
        exc.value
    )


def test_group_schema_logic_success():
    """Tests valid cases for GroupsCreate (only one or neither provided)."""
    # Only major
    group1 = GroupsCreate(
        group_name="Test Group 1", study_program=1, major=10, elective_block=None
    )
    assert group1.major == 10
    assert group1.elective_block is None

    # Neither major nor elective block
    group2 = GroupsCreate(
        group_name="Test Group 2", study_program=1, major=None, elective_block=None
    )
    assert group2.major is None


def test_group_update_schema_logic_error():
    """Tests the mutual exclusion logic for the GroupsUpdate schema."""
    with pytest.raises(ValidationError) as exc:
        GroupsUpdate(major=5, elective_block=3)
    assert "`major` and `elective_block` cannot be set at the same time" in str(
        exc.value
    )


# ==========================================
# TESTS: Academic Calendar (Numeric ranges)
# ==========================================


def test_calendar_week_number_limits():
    """Tests if week_number falls strictly within the 1-20 range."""
    base_data = {
        "calendar_date": "2026-04-08",
        "academic_year": "2025/2026",
        "semester_type": SemesterType.WINTER,
        "academic_day_of_week": 1,
    }

    # Too low
    with pytest.raises(ValidationError) as exc_low:
        AcademicCalendarCreate(**base_data, week_number=0)
    assert "Input should be greater than or equal to 1" in str(exc_low.value)

    # Too high
    with pytest.raises(ValidationError) as exc_high:
        AcademicCalendarCreate(**base_data, week_number=21)
    assert "Input should be less than or equal to 20" in str(exc_high.value)

    # Valid
    valid_calendar = AcademicCalendarCreate(**base_data, week_number=10)
    assert valid_calendar.week_number == 10


def test_calendar_day_of_week_limits():
    """Tests if academic_day_of_week falls strictly within the 1-7 range."""
    base_data = {
        "calendar_date": "2026-04-08",
        "academic_year": "2025/2026",
        "semester_type": SemesterType.WINTER,
        "week_number": 5,
    }

    # Too low
    with pytest.raises(ValidationError) as exc_low:
        AcademicCalendarCreate(**base_data, academic_day_of_week=0)
    assert "Input should be greater than or equal to 1" in str(exc_low.value)

    # Too high
    with pytest.raises(ValidationError) as exc_high:
        AcademicCalendarCreate(**base_data, academic_day_of_week=8)
    assert "Input should be less than or equal to 7" in str(exc_high.value)


# ==========================================
# TESTS: Router Helpers
# ==========================================


def test_check_for_payload_duplicates_raises_error():
    """Tests if the helper function correctly identifies and rejects duplicate dates."""
    dates = [date(2026, 4, 8), date(2026, 4, 8)]
    with pytest.raises(HTTPException) as exc:
        _check_for_payload_duplicates(dates)

    assert exc.value.status_code == 400
    assert "Payload contains duplicate dates" in exc.value.detail


def test_check_for_payload_duplicates_success():
    """Tests if the helper function passes successfully when all dates are unique."""
    dates = [date(2026, 4, 8), date(2026, 4, 9)]
    # Execution without exceptions implies success
    _check_for_payload_duplicates(dates)
