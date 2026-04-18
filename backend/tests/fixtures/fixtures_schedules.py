import pytest
from datetime import date, timedelta
import uuid

from src.schedules.models import (
    ScheduleSuggestion,
    SuggestionStatus,
    Employee_absences,
    AbsenceStatus,
)


@pytest.fixture
def create_test_suggestion(db_session):
    """Factory fixture to create a test schedule suggestion."""

    def _create(source="Test Source", reason="Room conflict"):
        obj = ScheduleSuggestion(
            source=source,
            reason=reason,
            target_class_session_id=uuid.uuid4(),
            state_before={"room_capacity": 15},
            state_after={"room_capacity": 30},
            status=SuggestionStatus.PENDING,
        )
        db_session.add(obj)
        db_session.commit()
        db_session.refresh(obj)
        return obj

    return _create


@pytest.fixture
def create_test_absence(db_session, create_test_employee):
    """Factory fixture to create a test employee absence."""

    def _create(employee_email="absent_user@test.pl", reason="Medical leave"):
        employee = create_test_employee(email=employee_email)

        obj = Employee_absences(
            employee_id=employee.id,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=1),
            reason=reason,
            status=AbsenceStatus.REPORTED,
        )
        db_session.add(obj)
        db_session.commit()
        db_session.refresh(obj)
        return obj

    return _create
