import pytest
from src.courses.models import (
    Study_program,
    Study_fields,
)


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("admin", 201, id="Admin-Can-Create"),
        pytest.param("schedule_manager", 403, id="Manager-Forbidden"),
        pytest.param("dean", 201, id="Dean-Can-Create"),
        pytest.param("guest", 401, id="Guest-Unauthorized"),
    ],
)
def test_create_study_program_permissions(
    client, db_session, get_auth_headers, role_name, expected_status
):
    headers = get_auth_headers(role_name)

    field = Study_fields(faculty=1, field_name="Informatyka Stosowana")
    db_session.add(field)
    db_session.commit()

    payload = {
        "study_field": field.id,
        "start_year": "2025/2026",
        "program_name": "Program Inżynierski",
    }

    response = client.post("/course/study-programs", json=payload, headers=headers)

    assert (
        response.status_code == expected_status
    ), f"Role {role_name} failed. Expected {expected_status}, but got {response.status_code}. Response: {response.json()}"

    if expected_status == 201:
        assert response.json()["program_name"] == "Program Inżynierski"
