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
def test_endpoint_view_course_types(
    client, db_session, get_auth_headers, role_name, expected_status
):
    headers = get_auth_headers(role_name)
    response = client.get("/course/types", headers=headers)

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
def test_endpoint_view_course_type(
    client,
    db_session,
    get_auth_headers,
    create_test_course_type,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    course_type = create_test_course_type(class_type="Lecture")

    response = client.get(
        f"/course/types/{course_type.course}/{course_type.class_type.value}",
        headers=headers,
    )

    assert response.status_code == expected_status
    if expected_status == 200:
        data = response.json()
        assert data["course"] == course_type.course
        assert data["class_type"] == course_type.class_type.value


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 201, id="admin-can-create"),
        pytest.param("Schedule Manager", 403, id="manager-forbidden"),
        pytest.param("Dean's Office", 201, id="dean-can-create"),
        pytest.param("Head of Unit", 403, id="head-of-unit-forbidden"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_create_course_type(
    client,
    db_session,
    get_auth_headers,
    create_test_course,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    course = create_test_course(course_code=1, course_name=f"Course for {role_name}")

    payload = {
        "course": course.course_code,
        "class_type": "Laboratory",
        "class_hours": 15,
        "slots_per_class": 1,
        "frequency": "Every_week",
        "pc_needed": True,
        "projector_needed": False,
        "max_group_participants_number": 12,
    }

    response = client.post("/course/types", json=payload, headers=headers)

    assert response.status_code == expected_status
    if expected_status == 201:
        data = response.json()
        assert data["course"] == payload["course"]
        assert data["class_type"] == payload["class_type"]
        assert data["class_hours"] == 15


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-update"),
        pytest.param("Schedule Manager", 403, id="manager-forbidden"),
        pytest.param("Dean's Office", 200, id="dean-can-update"),
        pytest.param("Head of Unit", 403, id="head-of-unit-forbidden"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_update_course_type(
    client,
    db_session,
    get_auth_headers,
    create_test_course,
    create_test_course_type,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    course = create_test_course(course_code=1)
    course_type = create_test_course_type(
        course_code=course.course_code, class_type="Tutorials"
    )

    payload = {"class_hours": 45, "pc_needed": True}

    response = client.patch(
        f"/course/types/{course_type.course}/{course_type.class_type.value}",
        json=payload,
        headers=headers,
    )

    assert response.status_code == expected_status
    if expected_status == 200:
        data = response.json()
        assert data["class_hours"] == 45
        assert data["pc_needed"] is True


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 204, id="admin-can-delete"),
        pytest.param("Schedule Manager", 403, id="manager-forbidden"),
        pytest.param("Dean's Office", 204, id="dean-can-delete"),
        pytest.param("Head of Unit", 403, id="head-of-unit-forbidden"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_delete_course_type(
    client,
    db_session,
    get_auth_headers,
    create_test_course,
    create_test_course_type,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    course = create_test_course(course_code=1)
    course_type = create_test_course_type(
        course_code=course.course_code, class_type="Seminar"
    )

    url = f"/course/types/{course_type.course}/{course_type.class_type.value}"
    response = client.delete(url, headers=headers)

    assert response.status_code == expected_status
    if expected_status == 204:
        admin_headers = get_auth_headers("Administrator")
        check = client.get(url, headers=admin_headers)
        assert check.status_code == 404
