import pytest
from src.courses.models import CourseLanguage


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
def test_endpoint_view_courses(
    client, db_session, get_auth_headers, role_name, expected_status
):
    headers = get_auth_headers(role_name)
    response = client.get("/course/", headers=headers)

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
def test_endpoint_view_course(
    client,
    db_session,
    get_auth_headers,
    create_test_course,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    course = create_test_course(course_code=1, course_name=f"View Course {role_name}")

    response = client.get(f"/course/{course.course_code}", headers=headers)

    assert response.status_code == expected_status
    if expected_status == 200:
        data = response.json()
        assert data["course_code"] == course.course_code
        assert data["course_name"] == course.course_name


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
def test_endpoint_create_course(
    client,
    db_session,
    get_auth_headers,
    create_test_unit,
    create_test_employee,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    unit = create_test_unit(unit_name=f"Unit_for_{role_name}")
    employee = create_test_employee(
        email=f"coord_{role_name}@test.pl", unit_name=unit.unit_name
    )

    payload = {
        "course_code": 1,
        "ects_points": 5,
        "course_name": f"New Course {role_name}",
        "course_language": CourseLanguage.POLISH.value,
        "leading_unit": unit.id,
        "course_coordinator": employee.id,
    }

    response = client.post("/course/", json=payload, headers=headers)

    assert response.status_code == expected_status
    if expected_status == 201:
        data = response.json()
        assert data["course_code"] == payload["course_code"]
        assert data["course_name"] == payload["course_name"]


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-update"),
        pytest.param("Schedule Manager", 403, id="manager-forbidden"),
        pytest.param("Dean's Office", 200, id="dean-can-update"),
        pytest.param("Head of Unit", 200, id="head-of-unit-can-update"),
        pytest.param("Instructor", 200, id="instructor-can-update"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_update_course(
    client,
    db_session,
    get_auth_headers,
    create_test_course,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    course = create_test_course(course_code=1, course_name=f"Old Name {role_name}")

    payload = {"course_name": f"Updated Name {role_name}", "ects_points": 7}

    response = client.patch(
        f"/course/{course.course_code}", json=payload, headers=headers
    )

    assert response.status_code == expected_status
    if expected_status == 200:
        data = response.json()
        assert data["course_name"] == payload["course_name"]
        assert data["ects_points"] == payload["ects_points"]


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
def test_endpoint_delete_course(
    client,
    db_session,
    get_auth_headers,
    create_test_course,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    course = create_test_course(course_code=1, course_name=f"To Delete {role_name}")

    response = client.delete(f"/course/{course.course_code}", headers=headers)

    assert response.status_code == expected_status
    if expected_status == 204:
        admin_headers = get_auth_headers("Administrator")
        check = client.get(f"/course/{course.course_code}", headers=admin_headers)
        assert check.status_code == 404
