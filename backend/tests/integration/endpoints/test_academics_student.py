import pytest
from src.courses.models import (
    Study_program,
    Study_fields,
)
from src.academics.models import Students
from src.users.models import Users


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
def test_endpoint_view_students(
    client, db_session, get_auth_headers, role_name, expected_status
):
    headers = get_auth_headers(
        role_name,
        # additional_permissions=["academics:students:view"]
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
def test_endpoint_view_student(
    client,
    db_session,
    get_auth_headers,
    create_test_student,
    role_name,
    expected_status,
):
    email = f"{role_name.replace(' ', '_').lower()}@test.pl"
    student = create_test_student(email=email)

    headers = get_auth_headers(
        role_name,
        # additional_permissions=["academics:student:view"]
    )
    response = client.get(f"/academics/students/{student.id}", headers=headers)

    assert response.status_code == expected_status
    if expected_status == 200:
        data = response.json()
        assert data["id"] == student.id


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
def test_endpoint_create_student(
    client,
    db_session,
    get_auth_headers,
    create_test_student,
    role_name,
    expected_status,
):
    headers = get_auth_headers(
        role_name,
        # additional_permissions=["academics:student:create"]
    )
    dummy_student = create_test_student(email=f"candidate_{role_name}@test.pl")

    new_user = Users(
        email=f"fresh_mail_{role_name}@test.pl",
        password_hash="hash",
        name="New",
        surname="Student",
    )
    db_session.add(new_user)
    db_session.commit()

    payload = {
        "user_id": new_user.id,
        "study_program": dummy_student.study_program,
        "major": "Data Science",
    }

    response = client.post("/academics/students", json=payload, headers=headers)

    assert response.status_code == expected_status
    if expected_status == 201:
        data = response.json()
        assert data["user_id"] == new_user.id
        assert data["study_program"] == dummy_student.study_program


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-update"),
        pytest.param("Schedule Manager", 403, id="manager-forbidden"),
        pytest.param("Dean's Office", 200, id="dean-can-update"),
        pytest.param("Head of Unit", 403, id="head-of-unit-forbidden"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 200, id="student-can-update"),
        pytest.param("Administrative Staff", 403, id="administrative-staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_update_student(
    client,
    db_session,
    get_auth_headers,
    create_test_student,
    role_name,
    expected_status,
):
    email = f"{role_name.replace(' ', '_').lower()}@test.pl"
    student = create_test_student(email=email)

    headers = get_auth_headers(
        role_name,
        # additional_permissions=["academics:student:update"]
    )

    payload = {
        "user_id": student.user_id,
        "study_program": student.study_program,
        "major": "New Specialization",
    }

    response = client.patch(
        f"/academics/students/{student.id}", json=payload, headers=headers
    )

    assert response.status_code == expected_status
    if expected_status == 200:
        assert response.json()["major"] == "New Specialization"


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-delete"),
        pytest.param("Schedule Manager", 403, id="manager-forbidden"),
        pytest.param("Dean's Office", 200, id="dean-can-delete"),
        pytest.param("Head of Unit", 403, id="head-of-unit-forbidden"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="administrative-staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_delete_student(
    client,
    db_session,
    get_auth_headers,
    create_test_student,
    role_name,
    expected_status,
):
    student = create_test_student(email="to_be_deleted@test.pl")
    headers = get_auth_headers(
        role_name,
        # additional_permissions=["academics:student:delete"]
    )

    response = client.delete(f"/academics/students/{student.id}", headers=headers)

    assert response.status_code == expected_status
    if expected_status == 200:
        admin_headers = get_auth_headers("Administrator")
        check = client.get(f"/academics/students/{student.id}", headers=admin_headers)
        assert check.status_code == 404
