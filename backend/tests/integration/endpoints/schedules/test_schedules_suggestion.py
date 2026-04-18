import pytest
import uuid


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
def test_endpoint_view_suggestions(
    client, get_auth_headers, role_name, expected_status
):
    headers = get_auth_headers(role_name, additional_permissions=["suggestions:view"])
    response = client.get("/schedules/suggestions", headers=headers)
    assert response.status_code == expected_status


def test_endpoint_view_suggestions_with_filters(
    client, get_auth_headers, create_test_suggestion
):
    """Verifies that query parameters filter suggestions correctly."""
    headers = get_auth_headers(
        "Administrator", additional_permissions=["suggestions:view"]
    )

    s1 = create_test_suggestion(source="Manual", reason="Reason A")
    s2 = create_test_suggestion(source="AI", reason="Reason B")

    response_source = client.get(
        "/schedules/suggestions?source=Manual", headers=headers
    )

    assert response_source.status_code == 200
    data = response_source.json()["data"]
    assert any(s["id"] == s1.id for s in data)
    assert not any(s["id"] == s2.id for s in data)


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
def test_endpoint_view_suggestion(
    client, get_auth_headers, create_test_suggestion, role_name, expected_status
):
    headers = get_auth_headers(role_name, additional_permissions=["suggestion:view"])
    suggestion = create_test_suggestion()

    response = client.get(f"/schedules/suggestions/{suggestion.id}", headers=headers)
    assert response.status_code == expected_status


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 201, id="admin-can-create"),
        pytest.param("Schedule Manager", 201, id="manager-can-create"),
        pytest.param("Dean's Office", 201, id="dean-can-create"),
        pytest.param("Head of Unit", 201, id="head-can-create"),
        pytest.param("Instructor", 201, id="instructor-can-create"),
        pytest.param("Student", 201, id="student-can-create"),
        pytest.param("Administrative Staff", 201, id="staff-can-create"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_create_suggestion(
    client, get_auth_headers, role_name, expected_status
):
    headers = get_auth_headers(role_name, additional_permissions=["suggestion:create"])

    payload = {
        "source": "Manual",
        "reason": f"Request from {role_name}",
        "target_class_session_id": str(uuid.uuid4()),
        "state_before": {"room": "A"},
        "state_after": {"room": "B"},
    }

    response = client.post("/schedules/suggestions", json=payload, headers=headers)
    assert response.status_code == expected_status


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-resolve"),
        pytest.param("Schedule Manager", 200, id="manager-can-resolve"),
        pytest.param("Dean's Office", 200, id="dean-can-resolve"),
        pytest.param("Head of Unit", 403, id="head-forbidden"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_resolve_suggestion_rbac(
    client, get_auth_headers, create_test_suggestion, role_name, expected_status
):
    """Verifies RBAC for resolving a suggestion."""
    headers = get_auth_headers(role_name, additional_permissions=["suggestion:update"])
    suggestion = create_test_suggestion()

    payload = {"status": "ACCEPTED"}
    response = client.patch(
        f"/schedules/suggestions/{suggestion.id}", json=payload, headers=headers
    )

    assert response.status_code == expected_status


def test_endpoint_resolve_already_resolved_error(
    client, get_auth_headers, create_test_suggestion
):
    """Tests if the system blocks resolving an already processed suggestion."""
    headers = get_auth_headers(
        "Administrator", additional_permissions=["suggestion:update"]
    )
    suggestion = create_test_suggestion()

    resp1 = client.patch(
        f"/schedules/suggestions/{suggestion.id}",
        json={"status": "ACCEPTED"},
        headers=headers,
    )
    assert resp1.status_code == 200

    resp2 = client.patch(
        f"/schedules/suggestions/{suggestion.id}",
        json={"status": "REJECTED"},
        headers=headers,
    )
    assert resp2.status_code == 400
    assert "already resolved" in resp2.json()["detail"]


def test_endpoint_resolve_invalid_status_error(
    client, get_auth_headers, create_test_suggestion
):
    """Tests if the system rejects assigning non-terminal statuses like PENDING."""
    headers = get_auth_headers(
        "Administrator", additional_permissions=["suggestion:update"]
    )
    suggestion = create_test_suggestion()

    response = client.patch(
        f"/schedules/suggestions/{suggestion.id}",
        json={"status": "PENDING"},
        headers=headers,
    )
    assert response.status_code == 400
    assert "must be one of" in response.json()["detail"]


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 204, id="admin-can-delete"),
        pytest.param("Schedule Manager", 204, id="manager-can-delete"),
        pytest.param("Dean's Office", 204, id="dean-can-delete"),
        pytest.param("Head of Unit", 403, id="head-forbidden"),
        pytest.param("Instructor", 403, id="instructor-forbidden"),
        pytest.param("Student", 403, id="student-forbidden"),
        pytest.param("Administrative Staff", 403, id="staff-forbidden"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_delete_suggestion(
    client, get_auth_headers, create_test_suggestion, role_name, expected_status
):
    headers = get_auth_headers(role_name, additional_permissions=["suggestion:delete"])
    suggestion = create_test_suggestion()

    response = client.delete(f"/schedules/suggestions/{suggestion.id}", headers=headers)
    assert response.status_code == expected_status
