import pytest
from datetime import date, timedelta


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-view"),
        pytest.param("Schedule Manager", 200, id="manager-can-view"),
        pytest.param("Dean's Office", 200, id="dean-can-view"),
        pytest.param("Head of Unit", 200, id="head-can-view"),
        pytest.param("Instructor", 200, id="instructor-can-view"),
        pytest.param("Student", 200, id="student-can-view"),
        pytest.param("Administrative Staff", 200, id="staff-can-view"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_list_absences(client, get_auth_headers, role_name, expected_status):
    """Verifies RBAC for listing employee absences."""
    headers = get_auth_headers(role_name)
    response = client.get("/schedules/absences", headers=headers)

    assert response.status_code == expected_status


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-view"),
        pytest.param("Schedule Manager", 200, id="manager-can-view"),
        pytest.param("Dean's Office", 200, id="dean-can-view"),
        pytest.param("Head of Unit", 200, id="head-can-view"),
        pytest.param("Instructor", 200, id="instructor-can-view"),
        pytest.param("Student", 200, id="student-can-view"),
        pytest.param("Administrative Staff", 200, id="staff-can-view"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_get_absence(
    client, get_auth_headers, create_test_absence, role_name, expected_status
):
    """Verifies RBAC for viewing a single specific absence."""
    headers = get_auth_headers(role_name)
    absence = create_test_absence()

    response = client.get(f"/schedules/absences/{absence.id}", headers=headers)

    assert response.status_code == expected_status
    if expected_status == 200:
        assert response.json()["id"] == absence.id


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 201, id="admin-can-create"),
        pytest.param("Schedule Manager", 403, id="manager-forbidden"),
        pytest.param("Dean's Office", 201, id="dean-can-create"),
        pytest.param("Head of Unit", 201, id="head-can-create"),
        pytest.param("Instructor", 201, id="instructor-can-create"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_create_absence(
    client, get_auth_headers, create_test_employee, role_name, expected_status
):
    """Verifies that only specific staff roles can report an absence."""
    headers = get_auth_headers(role_name)
    safe_name = role_name.replace(" ", "_").lower()

    employee = create_test_employee(email=f"absent_{safe_name}@test.pl")

    payload = {
        "employee_id": employee.id,
        "start_date": str(date.today()),
        "end_date": str(date.today() + timedelta(days=3)),
        "reason": f"Medical leave reported by {role_name}",
    }

    response = client.post("/schedules/absences", json=payload, headers=headers)

    assert response.status_code == expected_status
    if expected_status == 201:
        assert response.json()["employee_id"] == employee.id
        assert response.json()["reason"] == payload["reason"]


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-update"),
        pytest.param("Schedule Manager", 403, id="manager-forbidden"),
        pytest.param("Dean's Office", 200, id="dean-can-update"),
        pytest.param("Head of Unit", 200, id="head-can-update"),
        pytest.param("Instructor", 200, id="instructor-can-update"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_update_absence(
    client, get_auth_headers, create_test_absence, role_name, expected_status
):
    """Tests updating an absence (e.g. extending dates or changing reasons)."""
    headers = get_auth_headers(role_name)
    absence = create_test_absence()

    new_end_date = str(date.today() + timedelta(days=10))
    payload = {"end_date": new_end_date, "reason": "Extended medical leave"}

    response = client.patch(
        f"/schedules/absences/{absence.id}", json=payload, headers=headers
    )

    assert response.status_code == expected_status
    if expected_status == 200:
        data = response.json()
        assert data["end_date"] == new_end_date
        assert data["reason"] == payload["reason"]


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 204, id="admin-can-delete"),
        pytest.param("Schedule Manager", 403, id="manager-forbidden"),
        pytest.param("Dean's Office", 204, id="dean-can-delete"),
        pytest.param("Head of Unit", 403, id="head-forbidden"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_delete_absence(
    client, get_auth_headers, create_test_absence, role_name, expected_status
):
    """Tests deleting an absence (restricted to Admin and Dean's Office)."""
    headers = get_auth_headers(role_name)
    absence = create_test_absence()

    response = client.delete(f"/schedules/absences/{absence.id}", headers=headers)

    assert response.status_code == expected_status
    if expected_status == 204:
        # Verify it was actually removed
        admin_headers = get_auth_headers(
            "Administrator", additional_permissions=["absence:view"]
        )
        check = client.get(f"/schedules/absences/{absence.id}", headers=admin_headers)
        assert check.status_code == 404
