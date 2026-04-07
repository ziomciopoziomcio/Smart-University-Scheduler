import pytest
from src.courses.models import (
    Study_program,
    Study_fields,
)
from src.academics.models import Students
from src.users.models import Users


@pytest.fixture
def create_test_student(db_session):
    """Helper fixture to create test student."""
    field = Study_fields(faculty=1, field_name="Computer Science")
    db_session.add(field)
    db_session.flush()

    program = Study_program(
        study_field=field.id,
        start_year="2025",
        program_name="Test programe",
    )
    db_session.add(program)
    db_session.flush()

    user = db_session.query(Users).first()
    if not user:
        user = Users(
            email="test@test.pl",
            password_hash="hash",
            name="Name",
            surname="Surname",
            email_verified=True,
        )
        db_session.add(user)
        db_session.flush()

    student = Students(
        user_id=user.id,
        study_program=program.id,
        major=None,
    )
    db_session.add(student)
    db_session.commit()

    return student


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-view"),
        pytest.param("Schedule Manager", 403, id="manager-forbidden"),
        pytest.param("Dean's Office", 200, id="dean-can-view"),
        pytest.param("Head of Unit", 200, id="head-of-unit-can-view"),
        pytest.param("Instructor", 200, id="instructor-can-view"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="administrative-staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_view_students(
    client, db_session, get_auth_headers, role_name, expected_status
):
    headers = get_auth_headers(
        role_name,
        # additional_permissions=["students:view"]
    )
    response = client.get("/academics/students", headers=headers)

    assert (
        response.status_code == expected_status
    ), f"Role {role_name} failed. Expected {expected_status}, but got {response.status_code}. Response: {response.json()}"


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-view"),
        pytest.param("Schedule Manager", 403, id="manager-forbidden"),
        pytest.param("Dean's Office", 200, id="dean-can-view"),
        pytest.param("Head of Unit", 200, id="head-of-unit-can-view"),
        pytest.param("Instructor", 200, id="instructor-can-view"),
        pytest.param("Student", 200, id="student-can-view"),
        pytest.param("Administrative Staff", 403, id="administrative-staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_view_single_student_permissions(
    client,
    db_session,
    get_auth_headers,
    create_test_student,
    role_name,
    expected_status,
):
    headers = get_auth_headers(
        role_name,
        # additional_permissions=["student:view"]
    )
    student = create_test_student

    response = client.get(f"/academics/students/{student.id}", headers=headers)

    assert (
        response.status_code == expected_status
    ), f"Role {role_name} failed. Expected {expected_status}, but got {response.status_code}. Response: {response.json()}"

    if expected_status == 200:
        data = response.json()
        assert data["id"] == student.id
        assert data["user_id"] == student.user_id


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 201, id="admin-can-create"),
        pytest.param("Schedule Manager", 403, id="manager-forbidden"),
        pytest.param("Dean's Office", 201, id="dean-can-create"),
        pytest.param("Head of Unit", 403, id="head-of-unit-forbidden"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="administrative-staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_create_student_permissions(
    client, db_session, get_auth_headers, role_name, expected_status
):
    headers = get_auth_headers(
        role_name,
        # additional_permissions=["student:create"]
    )

    field = Study_fields(faculty=1, field_name="Information Technology")
    db_session.add(field)
    db_session.flush()

    program = Study_program(
        study_field=field.id,
        start_year="2025/2026",
        program_name="Test programe",
    )
    db_session.add(program)
    db_session.flush()

    user = Users(
        email=f"new_student_{role_name.replace(' ', '_')}@test.pl",
        password_hash="hash",
        name="New",
        surname="Student",
        email_verified=True,
    )
    db_session.add(user)
    db_session.commit()

    payload = {
        "user_id": user.id,
        "study_program": program.id,
        "major": None,
    }

    response = client.post("/academics/students", json=payload, headers=headers)

    assert (
        response.status_code == expected_status
    ), f"Role {role_name} failed. Expected {expected_status}, but got {response.status_code}. Response: {response.json()}"

    if expected_status == 201:
        assert response.json()["user_id"] == user.id
        assert response.json()["study_program"] == program.id
