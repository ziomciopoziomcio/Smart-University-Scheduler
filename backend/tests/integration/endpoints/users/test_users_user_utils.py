import pytest
import pyotp
from src.users.models import Permissions, Roles, Users
from datetime import datetime, timedelta, timezone
from src.users.auth import create_password_reset_token, _hash_token, hash_password


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-read-me"),
        pytest.param("Schedule Manager", 200, id="manager-can-read-me"),
        pytest.param("Dean's Office", 200, id="dean-can-read-me"),
        pytest.param("Head of Unit", 200, id="head-of-unit-can-read-me"),
        pytest.param("Instructor", 200, id="instructor-can-read-me"),
        pytest.param("Student", 200, id="student-can-read-me"),
        pytest.param("Administrative Staff", 200, id="staff-can-read-me"),
        pytest.param("Guest", 200, id="guest-can-read-me"),
    ],
)
def test_endpoint_view_me(
    client, db_session, get_auth_headers, role_name, expected_status
):
    headers = get_auth_headers(role_name)
    response = client.get("/users/me", headers=headers)

    assert response.status_code == expected_status
    if expected_status == 200:
        data = response.json()
        expected_email = f"{role_name.replace(' ', '_').lower()}@test.pl"
        assert data["email"] == expected_email


def test_login_success(client, create_auth_user):
    user, password = create_auth_user(
        email="success_login@test.pl", password="StrongPassword123!"
    )

    response = client.post(
        "/users/login", data={"username": user.email, "password": password}
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["requires_2fa"] is False


def test_login_invalid_password(client, create_auth_user):
    user, _ = create_auth_user(
        email="wrong_pass@test.pl", password="StrongPassword123!"
    )

    response = client.post(
        "/users/login", data={"username": user.email, "password": "WrongPassword!999"}
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"


def test_login_invalid_email(client):
    response = client.post(
        "/users/login",
        data={"username": "doesnotexist@test.pl", "password": "Password123!"},
    )

    assert response.status_code == 401


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-setup-2fa"),
        pytest.param("Schedule Manager", 200, id="manager-can-setup-2fa"),
        pytest.param("Dean's Office", 200, id="dean-can-setup-2fa"),
        pytest.param("Head of Unit", 200, id="head-of-unit-can-setup-2fa"),
        pytest.param("Instructor", 200, id="instructor-can-setup-2fa"),
        pytest.param("Student", 200, id="student-can-setup-2fa"),
        pytest.param("Administrative Staff", 200, id="staff-can-setup-2fa"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_endpoint_2fa_setup_permissions(
    client, db_session, get_auth_headers, role_name, expected_status
):
    headers = get_auth_headers(role_name)
    response = client.post("/users/2fa/setup", headers=headers)

    assert response.status_code == expected_status
    if expected_status == 200:
        assert "secret" in response.json()
        assert "provisioning_uri" in response.json()


def test_2fa_complete_flow(client, db_session, create_auth_user):
    """
    Tests complete scenario.

    Steps:
    1. Registration and login
    2. Setup 2FA
    3. Confirm 2FA
    4. Repeated login (requires 2FA)
    5. Verify 2FA with TOTP
    6. Verify 2FA with backup code
    """
    user, password = create_auth_user(email="2fa_flow_master@test.pl")

    # 1. Registration and login
    login_resp = client.post(
        "/users/login", data={"username": user.email, "password": password}
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    perm_setup = db_session.query(Permissions).filter_by(code="user-2fa:setup").first()
    perm_confirm = (
        db_session.query(Permissions).filter_by(code="user-2fa:confirm").first()
    )

    if not perm_setup:
        perm_setup = Permissions(code="user-2fa:setup", name="2FA Setup")
        db_session.add(perm_setup)
    if not perm_confirm:
        perm_confirm = Permissions(code="user-2fa:confirm", name="2FA Confirm")
        db_session.add(perm_confirm)

    role = Roles(role_name="2FA_Tester")
    role.permissions.extend([perm_setup, perm_confirm])
    user.roles.append(role)
    db_session.commit()

    # 2: Setup 2FA
    setup_resp = client.post("/users/2fa/setup", headers=headers)
    assert setup_resp.status_code == 200
    secret = setup_resp.json()["secret"]

    # 3: Confirm 2FA
    totp = pyotp.TOTP(secret)
    current_code = totp.now()

    confirm_resp = client.post(
        "/users/2fa/confirm", json={"code": current_code}, headers=headers
    )
    assert confirm_resp.status_code == 200
    backup_codes = confirm_resp.json()["backup_codes"]
    assert len(backup_codes) == 8

    # 4: Repeated login (requires 2FA)
    login_resp_2 = client.post(
        "/users/login", data={"username": user.email, "password": password}
    )
    assert login_resp_2.status_code == 200
    login_data = login_resp_2.json()
    assert login_data["requires_2fa"] is True
    pre_auth_token = login_data["access_token"]

    # 5: Verify 2FA with TOTP
    verify_code = totp.now()
    verify_resp = client.post(
        "/users/2fa/verify",
        json={"pre_auth_token": pre_auth_token, "code": verify_code},
    )
    assert verify_resp.status_code == 200
    final_data = verify_resp.json()
    assert "access_token" in final_data
    assert final_data["token_type"] == "bearer"

    # 6: Verify 2FA with backup code
    login_resp_3 = client.post(
        "/users/login", data={"username": user.email, "password": password}
    )
    pre_auth_token_2 = login_resp_3.json()["access_token"]
    used_backup_code = backup_codes[0]

    verify_backup_resp = client.post(
        "/users/2fa/verify",
        json={"pre_auth_token": pre_auth_token_2, "code": used_backup_code},
    )
    assert verify_backup_resp.status_code == 200
    assert "access_token" in verify_backup_resp.json()

    verify_backup_fail = client.post(
        "/users/2fa/verify",
        json={"pre_auth_token": pre_auth_token_2, "code": used_backup_code},
    )
    assert verify_backup_fail.status_code == 400
    assert verify_backup_fail.json()["detail"] == "Invalid 2FA code"


def test_password_forgot_success(client, db_session, create_test_user):
    user = create_test_user(email="forgot_target@test.pl")

    response = client.post("/users/password/forgot", json={"email": user.email})

    assert response.status_code == 200
    assert "reset link has been sent" in response.json()["detail"]


def test_password_forgot_nonexistent_user(client):
    response = client.post("/users/password/forgot", json={"email": "nobody@test.pl"})
    assert response.status_code == 200


def test_password_reset_success(client, db_session, create_test_user):

    user = create_test_user(email="reset_target@test.pl")
    raw_token = create_password_reset_token()

    user.password_reset_token_hash = _hash_token(raw_token)
    user.password_reset_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    db_session.commit()

    payload = {
        "token": raw_token,
        "password": "NewStrongPassword123!",
        "password2": "NewStrongPassword123!",
    }

    response = client.post("/users/password/reset", json=payload)

    assert response.status_code == 200
    assert response.json()["detail"] == "Password has been reset"


def test_password_reset_invalid_token(client):
    payload = {
        "token": "invalid_or_fake_token_string_here_12345",
        "password": "NewStrongPassword123!",
        "password2": "NewStrongPassword123!",
    }
    response = client.post("/users/password/reset", json=payload)

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid or expired token"


@pytest.mark.parametrize(
    "role_name, expected_status",
    [
        pytest.param("Administrator", 200, id="admin-can-change-pass"),
        pytest.param("Schedule Manager", 200, id="manager-can-change-pass"),
        pytest.param("Dean's Office", 200, id="dean-can-change-pass"),
        pytest.param("Head of Unit", 200, id="head-of-unit-can-change-pass"),
        pytest.param("Instructor", 200, id="instructor-can-change-pass"),
        pytest.param("Student", 200, id="student-can-change-pass"),
        pytest.param("Administrative Staff", 200, id="staff-can-change-pass"),
        pytest.param("Guest", 403, id="guest-forbidden"),
    ],
)
def test_password_change(
    client, db_session, get_auth_headers, role_name, expected_status
):
    headers = get_auth_headers(role_name)
    email = f"{role_name.replace(' ', '_').lower()}@test.pl"

    target_user = db_session.query(Users).filter_by(email=email).first()
    if target_user:
        target_user.password_hash = hash_password("ValidOldPassword123!")
        db_session.commit()

    payload = {
        "old_password": "ValidOldPassword123!",
        "password": "NewValidPassword123!",
        "password2": "NewValidPassword123!",
    }

    response = client.post("/users/password/change", json=payload, headers=headers)

    assert response.status_code == expected_status
    if expected_status == 200:
        assert response.json()["detail"] == "Password changed"
