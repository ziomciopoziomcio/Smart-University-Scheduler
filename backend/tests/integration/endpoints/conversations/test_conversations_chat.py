import pytest


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 201, id="admin-can-create"),
        pytest.param("Schedule Manager", 201, id="manager-can-create"),
        pytest.param("Dean's Office", 201, id="dean-can-create"),
        pytest.param("Head of Unit", 201, id="head-of-unit-can-create"),
        pytest.param("Instructor", 201, id="instructor-can-create"),
        pytest.param("Student", 201, id="student-can-create"),
        pytest.param("Administrative Staff", 201, id="staff-can-create"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_create_chat(
    client, db_session, get_auth_headers, role_name, expected_status
):
    headers = get_auth_headers(role_name)
    payload = {"title": f"My chat as {role_name}"}

    response = client.post("/chats/", json=payload, headers=headers)

    assert response.status_code == expected_status
    if expected_status == 201:
        assert response.json()["title"] == payload["title"]


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
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_view_chats(
    client, db_session, get_auth_headers, create_test_chat, role_name, expected_status
):
    headers = get_auth_headers(role_name)
    email = f"{role_name.replace(' ', '_').lower()}@test.pl"

    create_test_chat(user_email=email, title="Listed Chat")

    response = client.get("/chats/", headers=headers)

    assert response.status_code == expected_status
    if expected_status == 200:
        data = response.json()
        assert "items" in data
        assert len(data["items"]) >= 1


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
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_view_chat(
    client, db_session, get_auth_headers, create_test_chat, role_name, expected_status
):
    headers = get_auth_headers(role_name)
    email = f"{role_name.replace(' ', '_').lower()}@test.pl"
    chat = create_test_chat(user_email=email, title=f"Specific Chat {role_name}")

    response = client.get(f"/chats/{chat.id}", headers=headers)

    assert response.status_code == expected_status
    if expected_status == 200:
        assert response.json()["title"] == chat.title


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-update"),
        pytest.param("Schedule Manager", 200, id="manager-can-update"),
        pytest.param("Dean's Office", 200, id="dean-can-update"),
        pytest.param("Head of Unit", 200, id="head-of-unit-can-update"),
        pytest.param("Instructor", 200, id="instructor-can-update"),
        pytest.param("Student", 200, id="student-can-update"),
        pytest.param("Administrative Staff", 200, id="staff-can-update"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_update_chat(
    client, db_session, get_auth_headers, create_test_chat, role_name, expected_status
):
    headers = get_auth_headers(role_name)
    email = f"{role_name.replace(' ', '_').lower()}@test.pl"
    chat = create_test_chat(user_email=email, title="Old Title")

    payload = {"title": "New Updated Title"}
    response = client.patch(f"/chats/{chat.id}", json=payload, headers=headers)

    assert response.status_code == expected_status
    if expected_status == 200:
        assert response.json()["title"] == "New Updated Title"


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 204, id="admin-can-delete"),
        pytest.param("Schedule Manager", 204, id="manager-can-delete"),
        pytest.param("Dean's Office", 204, id="dean-can-delete"),
        pytest.param("Head of Unit", 204, id="head-of-unit-can-delete"),
        pytest.param("Instructor", 204, id="instructor-can-delete"),
        pytest.param("Student", 204, id="student-can-delete"),
        pytest.param("Administrative Staff", 204, id="staff-can-delete"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_delete_chat(
    client, db_session, get_auth_headers, create_test_chat, role_name, expected_status
):
    headers = get_auth_headers(role_name)
    email = f"{role_name.replace(' ', '_').lower()}@test.pl"
    chat = create_test_chat(user_email=email, title="To Be Deleted")

    response = client.delete(f"/chats/{chat.id}", headers=headers)

    assert response.status_code == expected_status
    if expected_status == 204:
        check = client.get(f"/chats/{chat.id}", headers=headers)
        assert check.status_code == 404


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 201, id="admin-can-create-msg"),
        pytest.param("Schedule Manager", 201, id="manager-can-create-msg"),
        pytest.param("Dean's Office", 201, id="dean-can-create-msg"),
        pytest.param("Head of Unit", 201, id="head-of-unit-can-create-msg"),
        pytest.param("Instructor", 201, id="instructor-can-create-msg"),
        pytest.param("Student", 201, id="student-can-create-msg"),
        pytest.param("Administrative Staff", 201, id="staff-can-create-msg"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_create_message(
    client, db_session, get_auth_headers, create_test_chat, role_name, expected_status
):
    headers = get_auth_headers(role_name)
    email = f"{role_name.replace(' ', '_').lower()}@test.pl"
    chat = create_test_chat(user_email=email)

    payload = {"role": "user", "content": "Hello, this is my test message."}

    response = client.post(f"/chats/{chat.id}/messages", json=payload, headers=headers)

    assert response.status_code == expected_status
    if expected_status == 201:
        data = response.json()
        assert data["content"] == payload["content"]
        assert data["chat_id"] == chat.id


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-view-msg"),
        pytest.param("Schedule Manager", 200, id="manager-can-view-msg"),
        pytest.param("Dean's Office", 200, id="dean-can-view-msg"),
        pytest.param("Head of Unit", 200, id="head-of-unit-can-view-msg"),
        pytest.param("Instructor", 200, id="instructor-can-view-msg"),
        pytest.param("Student", 200, id="student-can-view-msg"),
        pytest.param("Administrative Staff", 200, id="staff-can-view-msg"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_view_messages(
    client,
    db_session,
    get_auth_headers,
    create_test_message,
    role_name,
    expected_status,
):
    headers = get_auth_headers(role_name)
    email = f"{role_name.replace(' ', '_').lower()}@test.pl"

    msg = create_test_message(user_email=email, content="Testing message listing")

    response = client.get(f"/chats/{msg.chat_id}/messages", headers=headers)

    assert response.status_code == expected_status
    if expected_status == 200:
        data = response.json()
        assert "items" in data
        assert len(data["items"]) >= 1
