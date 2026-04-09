import pytest


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-view"),
        pytest.param("Schedule Manager", 200, id="manager-can-view"),
        pytest.param("Dean's Office", 200, id="dean-can-view"),
        pytest.param("Head of Unit", 200, id="head-of-unit-can-view"),
        pytest.param("Instructor", 200, id="instructor-can-view"),
        pytest.param("Student", 200, id="student-can-view"),
        pytest.param("Administrative Staff", 200, id="staff-can-view"),
        pytest.param("Guest", 200, id="guest-can-view"),
    ],
)
def test_endpoint_view_course_instructors(
    client, db_session, get_auth_headers, role_name, expected_status
):
    headers = get_auth_headers(role_name)
    response = client.get("/course/instructors", headers=headers)

    assert response.status_code == expected_status


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-view"),
        pytest.param("Schedule Manager", 200, id="manager-can-view"),
        pytest.param("Dean's Office", 200, id="dean-can-view"),
        pytest.param("Head of Unit", 200, id="head-of-unit-can-view"),
        pytest.param("Instructor", 200, id="instructor-can-view"),
        pytest.param("Student", 200, id="student-can-view"),
        pytest.param("Administrative Staff", 200, id="staff-can-view"),
        pytest.param("Guest", 200, id="guest-can-view"),
    ],
)
def test_endpoint_view_course_instructor(
    client,
    db_session,
    get_auth_headers,
    create_test_course_instructor,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    instructor = create_test_course_instructor(
        employee_email=f"view_inst_{role_name.replace(' ', '_')}@test.pl",
        class_type="Lecture",
    )

    response = client.get(
        f"/course/instructors/{instructor.employee}/{instructor.course}/{instructor.class_type.value}",
        headers=headers,
    )

    assert response.status_code == expected_status
    if expected_status == 200:
        data = response.json()
        assert data["employee"] == instructor.employee
        assert data["course"] == instructor.course
        assert data["class_type"] == instructor.class_type.value


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 201, id="admin-can-create"),
        pytest.param("Schedule Manager", 403, id="manager-forbidden"),
        pytest.param("Dean's Office", 201, id="dean-can-create"),
        pytest.param("Head of Unit", 201, id="head-of-unit-can-create"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_create_course_instructor(
    client,
    db_session,
    get_auth_headers,
    create_test_employee,
    create_test_course_type,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)

    safe_name = role_name.replace(" ", "_")
    employee = create_test_employee(email=f"new_inst_{safe_name}@test.pl")
    course_type = create_test_course_type(course_code=1, class_type="Laboratory")

    payload = {
        "employee": employee.id,
        "course": course_type.course,
        "class_type": course_type.class_type.value,
        "hours": 45,
    }

    response = client.post("/course/instructors", json=payload, headers=headers)

    assert response.status_code == expected_status
    if expected_status == 201:
        data = response.json()
        assert data["employee"] == payload["employee"]
        assert data["course"] == payload["course"]
        assert data["class_type"] == payload["class_type"]
        assert data["hours"] == payload["hours"]


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-update"),
        pytest.param("Schedule Manager", 403, id="manager-forbidden"),
        pytest.param("Dean's Office", 200, id="dean-can-update"),
        pytest.param("Head of Unit", 200, id="head-of-unit-can-update"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_update_course_instructor(
    client,
    db_session,
    get_auth_headers,
    create_test_course_instructor,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    safe_name = role_name.replace(" ", "_")

    instructor = create_test_course_instructor(
        employee_email=f"update_inst_{safe_name}@test.pl", class_type="Tutorials"
    )

    payload = {"hours": 60}

    response = client.patch(
        f"/course/instructors/{instructor.employee}/{instructor.course}/{instructor.class_type.value}",
        json=payload,
        headers=headers,
    )

    assert response.status_code == expected_status
    if expected_status == 200:
        data = response.json()
        assert data["hours"] == 60


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 204, id="admin-can-delete"),
        pytest.param("Schedule Manager", 403, id="manager-forbidden"),
        pytest.param("Dean's Office", 204, id="dean-can-delete"),
        pytest.param("Head of Unit", 204, id="head-of-unit-can-delete"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_delete_course_instructor(
    client,
    db_session,
    get_auth_headers,
    create_test_course_instructor,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    safe_name = role_name.replace(" ", "_")

    instructor = create_test_course_instructor(
        employee_email=f"del_inst_{safe_name}@test.pl", class_type="Seminar"
    )

    url = f"/course/instructors/{instructor.employee}/{instructor.course}/{instructor.class_type.value}"
    response = client.delete(url, headers=headers)

    assert response.status_code == expected_status
    if expected_status == 204:
        admin_headers = get_auth_headers("Administrator")
        check = client.get(url, headers=admin_headers)
        assert check.status_code == 404
