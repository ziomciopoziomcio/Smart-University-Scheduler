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
def test_endpoint_view_curriculums(
    client, db_session, get_auth_headers, role_name, expected_status
):
    headers = get_auth_headers(role_name)
    response = client.get("/course/curriculum", headers=headers)

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
def test_endpoint_view_curriculum(
    client,
    db_session,
    get_auth_headers,
    create_test_curriculum,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    safe_name = role_name.replace(" ", "_")

    curriculum = create_test_curriculum(
        program_name=f"Prog_{safe_name}", course_code=1, semester=1
    )

    url = f"/course/curriculum/{curriculum.study_program}/{curriculum.course}/{curriculum.semester}"
    response = client.get(url, headers=headers)

    assert response.status_code == expected_status
    if expected_status == 200:
        data = response.json()
        assert data["study_program"] == curriculum.study_program
        assert data["course"] == curriculum.course
        assert data["semester"] == curriculum.semester


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
def test_endpoint_create_curriculum(
    client,
    db_session,
    get_auth_headers,
    create_test_study_program,
    create_test_course,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    safe_name = role_name.replace(" ", "_")

    program = create_test_study_program(program_name=f"New_Prog_{safe_name}")
    course = create_test_course(course_code=1, course_name=f"Course {safe_name}")

    payload = {
        "study_program": program.id,
        "course": course.course_code,
        "semester": 2,
        "major": None,
        "elective_block": None,
    }

    response = client.post("/course/curriculum", json=payload, headers=headers)

    assert response.status_code == expected_status
    if expected_status == 201:
        data = response.json()
        assert data["study_program"] == payload["study_program"]
        assert data["course"] == payload["course"]
        assert data["semester"] == payload["semester"]


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
def test_endpoint_update_curriculum(
    client,
    db_session,
    get_auth_headers,
    create_test_curriculum,
    create_test_major,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    safe_name = role_name.replace(" ", "_")

    curriculum = create_test_curriculum(
        program_name=f"Update_Prog_{safe_name}", course_code=1, semester=3
    )

    major = create_test_major(major_name=f"Major_for_{safe_name}")

    payload = {"major": major.id}

    url = f"/course/curriculum/{curriculum.study_program}/{curriculum.course}/{curriculum.semester}"
    response = client.patch(url, json=payload, headers=headers)

    assert response.status_code == expected_status
    if expected_status == 200:
        data = response.json()
        assert data["major"] == major.id


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
def test_endpoint_delete_curriculum(
    client,
    db_session,
    get_auth_headers,
    create_test_curriculum,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    safe_name = role_name.replace(" ", "_")

    curriculum = create_test_curriculum(
        program_name=f"Delete_Prog_{safe_name}", course_code=1, semester=4
    )

    url = f"/course/curriculum/{curriculum.study_program}/{curriculum.course}/{curriculum.semester}"
    response = client.delete(url, headers=headers)

    assert response.status_code == expected_status
    if expected_status == 204:
        admin_headers = get_auth_headers("Administrator")
        check = client.get(url, headers=admin_headers)
        assert check.status_code == 404
