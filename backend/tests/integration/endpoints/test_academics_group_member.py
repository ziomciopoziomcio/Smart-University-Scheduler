import pytest
from src.academics.models import Group_members


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-view"),
        pytest.param("Schedule Manager", 200, id="manager-can-view"),
        pytest.param("Dean's Office", 200, id="dean-can-view"),
        pytest.param("Head of Unit", 200, id="head-of-unit-can-view"),
        pytest.param("Instructor", 200, id="instructor-can-view"),
        pytest.param("Student", 200, id="student-can-view"),
        pytest.param("Administrative Staff", 403, id="staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_view_group_members(
    client, db_session, get_auth_headers, role_name, expected_status
):
    headers = get_auth_headers(role_name)
    response = client.get("/academics/group-members", headers=headers)

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
        pytest.param("Administrative Staff", 403, id="staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_view_group_member(
    client,
    db_session,
    get_auth_headers,
    create_test_group_member,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    membership = create_test_group_member()

    url = f"/academics/group-members/{membership.group}/{membership.student}"
    response = client.get(url, headers=headers)

    assert response.status_code == expected_status
    if expected_status == 200:
        data = response.json()
        assert data["group"] == membership.group
        assert data["student"] == membership.student


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
def test_endpoint_create_group_member(
    client,
    db_session,
    get_auth_headers,
    create_test_group,
    create_test_student,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    group = create_test_group(group_name=f"Group_{role_name}")
    student = create_test_student(email=f"member_{role_name.lower()}@test.pl")

    payload = {"group": group.id, "student": student.id}

    response = client.post("/academics/group-members", json=payload, headers=headers)

    assert response.status_code == expected_status
    if expected_status == 201:
        data = response.json()
        assert data["group"] == group.id
        assert data["student"] == student.id


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
def test_endpoint_update_group_member(
    client,
    db_session,
    get_auth_headers,
    create_test_group_member,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    membership = create_test_group_member()

    payload = {"group": membership.group, "student": membership.student}

    url = f"/academics/group-members/{membership.group}/{membership.student}"
    response = client.patch(url, json=payload, headers=headers)

    assert response.status_code == expected_status


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
def test_endpoint_delete_group_member(
    client,
    db_session,
    get_auth_headers,
    create_test_group_member,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    membership = create_test_group_member()

    url = f"/academics/group-members/{membership.group}/{membership.student}"
    response = client.delete(url, headers=headers)

    assert response.status_code == expected_status
    if expected_status == 204:
        admin_headers = get_auth_headers("Administrator")
        check = client.get(url, headers=admin_headers)
        assert check.status_code == 404
