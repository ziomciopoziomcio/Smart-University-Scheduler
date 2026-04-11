import pytest
from datetime import date, timedelta
from pydantic import ValidationError

from src.schedules.schemas import (
    GenerateScheduleRequest,
    EmployeeAbsenceCreate,
    EmployeeAbsenceUpdate,
)
from src.academics.models import SemesterType


# ==========================================
# TESTS: GenerateScheduleRequest
# ==========================================


def test_generate_schedule_academic_year_regex():
    """Tests the custom regex validation for academic_year (YYYY/YYYY)."""
    base_data = {"faculty_id": 1, "semester_type": SemesterType.WINTER}

    # Valid format
    valid = GenerateScheduleRequest(**base_data, academic_year="2025/2026")
    assert valid.academic_year == "2025/2026"

    # Invalid formats
    invalid_years = [
        "25/26",  # Too short
        "2025-2026",  # Wrong separator
        "abcd/efgh",  # Not digits
        "20252026",  # Missing separator
        "2025/202",  # Incomplete year
    ]

    for year in invalid_years:
        with pytest.raises(ValidationError) as exc:
            GenerateScheduleRequest(**base_data, academic_year=year)
        assert "academic_year must be in format YYYY/YYYY" in str(exc.value)


def test_generate_schedule_faculty_id_gt_zero():
    """Tests if faculty_id strictly requires a positive integer."""
    with pytest.raises(ValidationError) as exc_zero:
        GenerateScheduleRequest(
            faculty_id=0, academic_year="2025/2026", semester_type=SemesterType.WINTER
        )
    assert "Input should be greater than 0" in str(exc_zero.value)

    with pytest.raises(ValidationError) as exc_neg:
        GenerateScheduleRequest(
            faculty_id=-5, academic_year="2025/2026", semester_type=SemesterType.WINTER
        )
    assert "Input should be greater than 0" in str(exc_neg.value)


# ==========================================
# TESTS: EmployeeAbsence (Date Logic)
# ==========================================


def test_employee_absence_create_dates():
    """Tests if start_date must be before or equal to end_date during creation."""
    base_data = {"employee_id": 1, "reason": "Sick leave"}
    today = date.today()
    tomorrow = today + timedelta(days=1)
    yesterday = today - timedelta(days=1)

    # Valid: start < end
    valid_multi_day = EmployeeAbsenceCreate(
        **base_data, start_date=today, end_date=tomorrow
    )
    assert valid_multi_day.start_date < valid_multi_day.end_date

    # Valid: start == end (1-day absence is acceptable)
    valid_single_day = EmployeeAbsenceCreate(
        **base_data, start_date=today, end_date=today
    )
    assert valid_single_day.start_date == valid_single_day.end_date

    # Invalid: start > end
    with pytest.raises(ValidationError) as exc:
        EmployeeAbsenceCreate(**base_data, start_date=today, end_date=yesterday)
    assert "Start date must be before end date" in str(exc.value)


def test_employee_absence_update_dates():
    """Tests the date validation logic when partially updating an absence."""
    today = date.today()
    tomorrow = today + timedelta(days=1)
    yesterday = today - timedelta(days=1)

    # Valid: Only updating start_date
    valid_start = EmployeeAbsenceUpdate(start_date=today)
    assert valid_start.start_date == today

    # Valid: Only updating end_date
    valid_end = EmployeeAbsenceUpdate(end_date=tomorrow)
    assert valid_end.end_date == tomorrow

    # Valid: Updating both correctly
    valid_both = EmployeeAbsenceUpdate(start_date=today, end_date=tomorrow)
    assert valid_both.start_date < valid_both.end_date

    # Invalid: Updating both incorrectly (start > end)
    with pytest.raises(ValidationError) as exc:
        EmployeeAbsenceUpdate(start_date=today, end_date=yesterday)
    assert "Start date must be before end date" in str(exc.value)
