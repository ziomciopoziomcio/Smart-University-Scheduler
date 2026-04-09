import pytest
from src.users.models import Users
from src.academics.models import Units


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-view"),
        pytest.param("Schedule Manager", 200, id="manager-can-view"),
        pytest.param("Dean's Office", 200, id="dean-can-view"),
        pytest.param("Head of Unit", 200, id="head-of-unit-can-view"),
        pytest.param("Instructor", 200, id="instructor-can-view"),
        pytest.param("Student", 200, id="student-can-view"),
        pytest.param("Administrative Staff", 200, id="administrative-can-view"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_view_employees(
    client, db_session, get_auth_headers, role_name, expected_status
):
    headers = get_auth_headers(role_name)
    response = client.get("/academics/employees", headers=headers)
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
        pytest.param("Administrative Staff", 200, id="administrative-can-view"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_view_employee(
    client,
    db_session,
    get_auth_headers,
    create_test_employee,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    emp = create_test_employee(email=f"{role_name.replace(' ', '_').lower()}@test.pl")
    response = client.get(f"/academics/employees/{emp.id}", headers=headers)

    assert response.status_code == expected_status


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 201, id="admin-can-create"),
        pytest.param("Schedule Manager", 403, id="manager-forbidden"),
        pytest.param("Dean's Office", 201, id="dean-can-create"),
        pytest.param("Head of Unit", 403, id="head-of-unit-forbidden"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="administrative-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_create_employee(
    client,
    db_session,
    get_auth_headers,
    create_test_user,
    create_test_unit,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    safe_name = role_name.replace(" ", "_")

    new_user = create_test_user(email=f"new_emp_{safe_name}@test.pl")
    unit = create_test_unit(
        unit_name=f"Unit_for_{safe_name}", unit_short=f"U_{safe_name}"
    )
    payload = {
        "user_id": new_user.id,
        "faculty_id": unit.faculty_id,
        "unit_id": unit.id,
    }

    response = client.post("/academics/employees", json=payload, headers=headers)

    assert (
        response.status_code == expected_status
    ), f"Role {role_name} failed. Expected {expected_status}, but got {response.status_code}. Response: {response.json()}"


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-update"),
        pytest.param("Schedule Manager", 403, id="manager-forbidden"),
        pytest.param("Dean's Office", 200, id="dean-can-update"),
        pytest.param("Head of Unit", 403, id="head-of-unit-forbidden"),
        pytest.param("Instructor", 200, id="instructor-can-update"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="administrative-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_update_employee(
    client,
    db_session,
    get_auth_headers,
    create_test_employee,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    email = f"{role_name.replace(' ', '_').lower()}@test.pl"
    employee = create_test_employee(email=email)
    new_unit = Units(
        unit_name="New Test Department",
        unit_short="NTD",
        faculty_id=employee.faculty_id,
    )
    db_session.add(new_unit)
    db_session.commit()

    payload = {"unit_id": new_unit.id}

    response = client.patch(
        f"/academics/employees/{employee.id}", json=payload, headers=headers
    )

    assert (
        response.status_code == expected_status
    ), f"Role {role_name} failed. Expected {expected_status}, but got {response.status_code}. Response: {response.json()}"


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 204, id="admin-can-delete"),
        pytest.param("Schedule Manager", 403, id="manager-forbidden"),
        pytest.param("Dean's Office", 204, id="dean-can-delete"),
        pytest.param("Head of Unit", 403, id="head-of-unit-forbidden"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="administrative-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_delete_employee(
    client,
    db_session,
    get_auth_headers,
    create_test_employee,
    role_name,
    expected_status,
):

    employee = create_test_employee(email="to_be_deleted@test.pl")
    headers = get_auth_headers(role_name)

    response = client.delete(f"/academics/employees/{employee.id}", headers=headers)

    assert response.status_code == expected_status
    if expected_status == 204:
        admin_headers = get_auth_headers("Administrator")
        check = client.get(f"/academics/employees/{employee.id}", headers=admin_headers)
        assert check.status_code == 404
