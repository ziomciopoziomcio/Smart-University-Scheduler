import pytest
from src.courses.models import (
    Study_program,
    Study_fields,
)

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
        pytest.param("Administrative Staff", 200, id="administrative-staff-can-view"),
        pytest.param("Guest", 200, id="guest-can-view"),
    ],
)
def test_endpoint_view_units(
    client, db_session, get_auth_headers, role_name, expected_status
):
    headers = get_auth_headers(
        role_name,
        # additional_permissions=["units:view"]
    )
    response = client.get("/academics/units", headers=headers)

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
def test_endpoint_view_unit(
    client,
    db_session,
    get_auth_headers,
    create_test_unit,
    role_name,
    expected_status,
):
    headers = get_auth_headers(
        role_name,
        # additional_permissions=["unit:view"]
    )

    unit = create_test_unit()
    response = client.get(f"/academics/units/{unit.id}", headers=headers)

    assert response.status_code == expected_status
    if expected_status == 200:
        data = response.json()
        assert data["id"] == unit.id


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
def test_endpoint_create_unit(
    client,
    db_session,
    get_auth_headers,
    create_test_unit,
    role_name,
    expected_status,
):
    headers = get_auth_headers(
        role_name,
        # additional_permissions=["unit:create"]
    )

    payload = {
        "unit_name": "Institute of Mechatronics and Informatic Systems",
        "unit_short": "IMSI",
        "faculty_id": 1,
    }

    response = client.post("/academics/units", json=payload, headers=headers)

    assert response.status_code == expected_status

    if expected_status == 201:
        data = response.json()
        assert data["unit_name"] == "Institute of Mechatronics and Informatic Systems"
        assert data["unit_short"] == "IMSI"


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-update"),
        pytest.param("Schedule Manager", 403, id="manager-forbidden"),
        pytest.param("Dean's Office", 200, id="dean-can-update"),
        pytest.param("Head of Unit", 200, id="head-of-unit-can-update"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="administrative-staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_update_unit(
    client,
    db_session,
    get_auth_headers,
    create_test_unit,
    role_name,
    expected_status,
):
    headers = get_auth_headers(
        role_name,
        # additional_permissions=["unit:update"]
    )

    new_unit = create_test_unit()

    payload = {
        "unit_name": new_unit.unit_name,
        "unit_short": "NEW",
        "faculty_id": new_unit.faculty_id,
    }

    response = client.patch(
        f"/academics/units/{new_unit.id}", json=payload, headers=headers
    )

    assert response.status_code == expected_status
    if expected_status == 200:
        assert response.json()["unit_short"] == "NEW"


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
def test_endpoint_delete_unit(
    client,
    db_session,
    get_auth_headers,
    create_test_unit,
    role_name,
    expected_status,
):
    headers = get_auth_headers(
        role_name,
        # additional_permissions=["unit:delete"]
    )

    unit = create_test_unit()

    response = client.delete(f"/academics/units/{unit.id}", headers=headers)

    assert response.status_code == expected_status
    if expected_status == 204:
        admin_headers = get_auth_headers(
            "Administrator",
            # additional_permissions=["unit:view"]
        )
        check = client.get(f"/academics/students/{unit.id}", headers=admin_headers)
        assert check.status_code == 404
