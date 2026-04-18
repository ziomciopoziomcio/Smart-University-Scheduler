import pytest


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
    headers = get_auth_headers(role_name)
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
    headers = get_auth_headers(role_name)
    email = f"{role_name.replace(' ', '_').lower()}@test.pl"
    student = create_test_student(email=email)
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
    create_test_user,
    create_test_study_program,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    safe_name = role_name.replace(" ", "_")
    new_user = create_test_user(email=f"fresh_student_{safe_name}@test.pl")
    program = create_test_study_program(program_name=f"Prog_{safe_name}")

    payload = {
        "user_id": new_user.id,
        "study_program": program.id,
        "major": None,
    }

    response = client.post("/academics/students", json=payload, headers=headers)
    assert response.status_code == expected_status
    if expected_status == 201:
        data = response.json()
        assert data["user_id"] == new_user.id
        assert data["study_program"] == program.id


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
    headers = get_auth_headers(role_name)

    email = f"{role_name.replace(' ', '_').lower()}@test.pl"
    student = create_test_student(email=email)
    payload = {
        "user_id": student.user_id,
        "study_program": student.study_program,
        "major": 2,
    }

    response = client.patch(
        f"/academics/students/{student.id}", json=payload, headers=headers
    )

    assert response.status_code == expected_status
    if expected_status == 200:
        assert response.json()["major"] == 2


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 204, id="admin-can-delete"),
        pytest.param("Schedule Manager", 403, id="manager-forbidden"),
        pytest.param("Dean's Office", 204, id="dean-can-delete"),
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
    headers = get_auth_headers(role_name)
    student = create_test_student(email="to_be_deleted@test.pl")

    response = client.delete(f"/academics/students/{student.id}", headers=headers)

    assert response.status_code == expected_status
    if expected_status == 204:
        admin_headers = get_auth_headers("Administrator")
        check = client.get(f"/academics/students/{student.id}", headers=admin_headers)
        assert check.status_code == 404
