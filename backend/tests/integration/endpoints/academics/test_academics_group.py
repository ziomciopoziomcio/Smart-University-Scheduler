import pytest
from src.academics.models import Groups


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-view"),
        pytest.param("Schedule Manager", 200, id="manager-can-view"),
        pytest.param("Dean's Office", 200, id="dean-can-view"),
        pytest.param("Head of Unit", 200, id="head-of-unit-can-view"),
        pytest.param("Instructor", 200, id="instructor-can-view"),
        pytest.param("Student", 200, id="student-can-view"),
        pytest.param("Administrative Staff", 200, id="administrative-staff-can-view"),
        pytest.param("Guest", 200, id="guest-can-view"),
    ],
)
def test_endpoint_view_groups(
    client, db_session, get_auth_headers, role_name, expected_status
):
    headers = get_auth_headers(
        role_name,
        # additional_permissions=["groups:view"]
    )
    response = client.get("/academics/groups", headers=headers)

    assert (
        response.status_code == expected_status
    ), f"Role {role_name} failed. Expected {expected_status}, but got {response.status_code}. Response: {response.json()}"


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-view"),
        pytest.param("Schedule Manager", 200, id="manager-can-view"),
        pytest.param("Dean's Office", 200, id="dean-can-view"),
        pytest.param("Head of Unit", 200, id="head-of-unit-can-view"),
        pytest.param("Instructor", 200, id="instructor-can-view"),
        pytest.param("Student", 200, id="student-can-view"),
        pytest.param("Administrative Staff", 200, id="administrative-staff-can-view"),
        pytest.param("Guest", 200, id="guest-can-view"),
    ],
)
def test_endpoint_view_group(
    client,
    db_session,
    get_auth_headers,
    create_test_group,
    role_name,
    expected_status,
):
    headers = get_auth_headers(
        role_name,
        # additional_permissions=["group:view"]
    )

    group = create_test_group()
    response = client.get(f"/academics/groups/{group.id}", headers=headers)

    assert response.status_code == expected_status
    if expected_status == 200:
        data = response.json()
        assert data["id"] == group.id


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 201, id="admin-can-create"),
        pytest.param("Schedule Manager", 201, id="manager-can-create"),
        pytest.param("Dean's Office", 201, id="dean-can-create"),
        pytest.param("Head of Unit", 403, id="head-of-unit-forbidden"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="administrative-staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_create_group_success(
    client,
    db_session,
    get_auth_headers,
    create_test_student,
    role_name,
    expected_status,
):
    headers = get_auth_headers(
        role_name,
        # additional_permissions=["group:create"]
    )

    tmp_student = create_test_student(email=f"helper_{role_name}@test.pl")
    prog_id = tmp_student.study_program
    payload = {
        "group_name": f"Test Group {role_name}",
        "study_program": prog_id,
        "major": 1,
        "elective_block": None,
    }

    response = client.post("/academics/groups", json=payload, headers=headers)
    print(response.json())
    assert response.status_code == expected_status
    if expected_status == 201:
        data = response.json()
        assert data["group_name"] == payload["group_name"]
        assert data["major"] == 1
        assert data["elective_block"] is None


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 201, id="admin-can-create-but-fails"),
        pytest.param("Schedule Manager", 201, id="manager-can-create-but-fails"),
        pytest.param("Dean's Office", 201, id="dean-can-create-but-fails"),
        pytest.param("Head of Unit", 403, id="head-of-unit-forbidden"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="administrative-staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_create_group_validation_error(
    client,
    db_session,
    get_auth_headers,
    create_test_student,
    role_name,
    expected_status,
):
    headers = get_auth_headers(
        role_name,
        # additional_permissions=["group:create"]
    )

    tmp_student = create_test_student(email=f"helper_{role_name}@test.pl")
    prog_id = tmp_student.study_program
    payload = {
        "group_name": f"Test Group {role_name}",
        "study_program": prog_id,
        "major": 1,
        "elective_block": 1,
    }

    response = client.post("/academics/groups", json=payload, headers=headers)

    if expected_status == 403:
        assert response.status_code == expected_status
    else:
        assert response.status_code == 422


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-update"),
        pytest.param("Schedule Manager", 200, id="manager-can-update"),
        pytest.param("Dean's Office", 200, id="dean-can-update"),
        pytest.param("Head of Unit", 403, id="head-of-unit-forbidden"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="administrative-staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_update_group(
    client,
    db_session,
    get_auth_headers,
    create_test_group,
    role_name,
    expected_status,
):
    headers = get_auth_headers(
        role_name,
        # additional_permissions=["group:update"]
    )

    group = create_test_group()

    payload = {"group_name": f"Updated Name {role_name}"}

    response = client.patch(
        f"/academics/groups/{group.id}", json=payload, headers=headers
    )

    assert response.status_code == expected_status
    if expected_status == 200:
        data = response.json()
        assert data["group_name"] == payload["group_name"]
        assert data["major"] is None


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 204, id="admin-can-delete"),
        pytest.param("Schedule Manager", 204, id="manager-can-delete"),
        pytest.param("Dean's Office", 204, id="dean-can-delete"),
        pytest.param("Head of Unit", 403, id="head-of-unit-forbidden"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="administrative-staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_delete_group(
    client,
    db_session,
    get_auth_headers,
    create_test_group,
    role_name,
    expected_status,
):
    headers = get_auth_headers(
        role_name,
        # additional_permissions=["group:delete"]
    )

    group = create_test_group()

    response = client.delete(f"/academics/groups/{group.id}", headers=headers)

    assert response.status_code == expected_status
    if expected_status == 204:
        admin_headers = get_auth_headers(
            "Administrator",
            # additional_permissions=["group:view"]
        )
        check = client.get(f"/academics/students/{group.id}", headers=admin_headers)
        assert check.status_code == 404
