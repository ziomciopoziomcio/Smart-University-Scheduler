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
    """E2E test for 2FA: Setup -> Confirm -> Login -> Verify TOTP -> Verify Backup Code."""
    user, pwd = create_auth_user(email="2fa_flow@test.pl")

    # 1. Assign permissions and get token
    perms = (
        db_session.query(Permissions)
        .filter(Permissions.code.in_(["user-2fa:setup", "user-2fa:confirm"]))
        .all()
    )
    user.roles.append(Roles(role_name="2fa_role", permissions=perms))
    db_session.commit()

    token = client.post(
        "/users/login", data={"username": user.email, "password": pwd}
    ).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Setup & Confirm 2FA
    secret = client.post("/users/2fa/setup", headers=headers).json()["secret"]
    totp = pyotp.TOTP(secret)
    conf_resp = client.post(
        "/users/2fa/confirm", json={"code": totp.now()}, headers=headers
    )
    backup_codes = conf_resp.json()["backup_codes"]

    assert conf_resp.status_code == 200 and len(backup_codes) == 8

    # 3. Repeated login & Verify with TOTP
    pre_auth = client.post(
        "/users/login", data={"username": user.email, "password": pwd}
    ).json()["access_token"]
    verify_totp_resp = client.post(
        "/users/2fa/verify", json={"pre_auth_token": pre_auth, "code": totp.now()}
    )
    assert (
        verify_totp_resp.status_code == 200
        and "access_token" in verify_totp_resp.json()
    )

    # 4. Repeated login & Verify with Backup Code (and test reuse failure)
    pre_auth_2 = client.post(
        "/users/login", data={"username": user.email, "password": pwd}
    ).json()["access_token"]

    verify_backup_resp = client.post(
        "/users/2fa/verify",
        json={"pre_auth_token": pre_auth_2, "code": backup_codes[0]},
    )
    assert verify_backup_resp.status_code == 200

    verify_backup_fail = client.post(
        "/users/2fa/verify",
        json={"pre_auth_token": pre_auth_2, "code": backup_codes[0]},
    )
    assert verify_backup_fail.status_code == 400


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
