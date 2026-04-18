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
def test_endpoint_view_faculties(
    client, db_session, get_auth_headers, role_name, expected_status
):
    headers = get_auth_headers(role_name)
    response = client.get("/facilities/faculties", headers=headers)

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
def test_endpoint_view_faculty(
    client,
    db_session,
    get_auth_headers,
    create_test_faculty,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    safe_name = role_name.replace(" ", "_")
    faculty = create_test_faculty(
        faculty_name=f"View Faculty {safe_name}", faculty_short=f"VF_{safe_name}"
    )

    response = client.get(f"/facilities/faculties/{faculty.id}", headers=headers)

    assert response.status_code == expected_status
    if expected_status == 200:
        data = response.json()
        assert data["id"] == faculty.id
        assert data["faculty_name"] == faculty.faculty_name


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 201, id="admin-can-create"),
        pytest.param("Schedule Manager", 403, id="manager-forbidden"),
        pytest.param("Dean's Office", 403, id="dean-forbidden"),
        pytest.param("Head of Unit", 403, id="head-of-unit-forbidden"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_create_faculty(
    client,
    db_session,
    get_auth_headers,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    safe_name = role_name.replace(" ", "_")

    payload = {
        "faculty_name": f"New Faculty {safe_name}",
        "faculty_short": f"NF_{safe_name}",
    }

    response = client.post("/facilities/faculties", json=payload, headers=headers)

    assert response.status_code == expected_status
    if expected_status == 201:
        data = response.json()
        assert data["faculty_name"] == payload["faculty_name"]
        assert data["faculty_short"] == payload["faculty_short"]


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-update"),
        pytest.param("Schedule Manager", 403, id="manager-forbidden"),
        pytest.param("Dean's Office", 403, id="dean-forbidden"),
        pytest.param("Head of Unit", 403, id="head-of-unit-forbidden"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_update_faculty(
    client,
    db_session,
    get_auth_headers,
    create_test_faculty,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    safe_name = role_name.replace(" ", "_")
    faculty = create_test_faculty(
        faculty_name=f"Old Faculty {safe_name}", faculty_short=f"OF_{safe_name}"
    )

    payload = {"faculty_name": f"Updated Faculty {safe_name}"}

    response = client.patch(
        f"/facilities/faculties/{faculty.id}", json=payload, headers=headers
    )

    assert response.status_code == expected_status
    if expected_status == 200:
        data = response.json()
        assert data["faculty_name"] == payload["faculty_name"]
        assert data["faculty_short"] == faculty.faculty_short


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 204, id="admin-can-delete"),
        pytest.param("Schedule Manager", 403, id="manager-forbidden"),
        pytest.param("Dean's Office", 403, id="dean-forbidden"),
        pytest.param("Head of Unit", 403, id="head-of-unit-forbidden"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_delete_faculty(
    client,
    db_session,
    get_auth_headers,
    create_test_faculty,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    safe_name = role_name.replace(" ", "_")
    faculty = create_test_faculty(
        faculty_name=f"To Delete {safe_name}", faculty_short=f"TD_{safe_name}"
    )

    response = client.delete(f"/facilities/faculties/{faculty.id}", headers=headers)

    assert response.status_code == expected_status
    if expected_status == 204:
        admin_headers = get_auth_headers("Administrator")
        check = client.get(f"/facilities/faculties/{faculty.id}", headers=admin_headers)
        assert check.status_code == 404
