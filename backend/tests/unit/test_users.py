import pytest
from pydantic import ValidationError

from src.users.schemas import (
    SignupRequest,
    PasswordResetRequest,
    PasswordChangeRequest,
    UserCreate,
    RoleUpdate,
)

# ==========================================
# TESTS: Signup & Password Matching Logic
# ==========================================


def test_signup_passwords_match_success():
    """Tests if signup passes when both passwords are identical."""
    data = {
        "email": "test@example.com",
        "password": "SecretPassword123",
        "password2": "SecretPassword123",
        "name": "John",
        "surname": "Doe",
    }
    signup = SignupRequest(**data)
    assert signup.email == data["email"]


def test_signup_passwords_mismatch_error():
    """Tests if signup raises a ValidationError when passwords do not match."""
    data = {
        "email": "test@example.com",
        "password": "SecretPassword123",
        "password2": "DifferentPassword456",
        "name": "John",
        "surname": "Doe",
    }
    with pytest.raises(ValidationError) as exc:
        SignupRequest(**data)
    assert "Passwords do not match" in str(exc.value)


def test_password_reset_mismatch_error():
    """Tests if password reset validation fails when passwords are different."""
    with pytest.raises(ValidationError) as exc:
        PasswordResetRequest(
            token="some_secure_token_12345",
            password="NewPassword123",
            password2="TypoInPassword123",
        )
    assert "Passwords do not match" in str(exc.value)


# ==========================================
# TESTS: Field Constraints (Length & Types)
# ==========================================


def test_user_password_min_length():
    """Tests if the system rejects passwords shorter than 8 characters in signup."""
    data = {
        "email": "short@test.pl",
        "password": "short",  # 5 chars
        "password2": "short",
        "name": "A",
        "surname": "B",
    }
    with pytest.raises(ValidationError) as exc:
        SignupRequest(**data)
    assert "String should have at least 8 characters" in str(exc.value)


def test_user_email_validation():
    """Tests Pydantic's EmailStr validation."""
    with pytest.raises(ValidationError):
        UserCreate(
            email="not-an-email", password="SecurePassword123", name="N", surname="S"
        )


def test_role_name_max_length():
    """Tests if role name respects the 255 characters limit."""
    too_long_name = "a" * 256
    with pytest.raises(ValidationError) as exc:
        RoleUpdate(role_name=too_long_name)
    assert "String should have at most 255 characters" in str(exc.value)


# ==========================================
# TESTS: Password Change Logic
# ==========================================


def test_password_change_matching_success():
    """Tests valid password change payload."""
    payload = PasswordChangeRequest(
        old_password="OldOne123!", password="NewOne123!", password2="NewOne123!"
    )
    assert payload.password == "NewOne123!"


def test_password_change_mismatch_error():
    """Tests if password change fails when new passwords are not identical."""
    data = {
        "old_password": "OldOne123!",
        "password": "NewOne123!",
        "password2": "DifferentOne123!",
    }

    with pytest.raises(ValidationError) as exc:
        PasswordChangeRequest(**data)

    assert "Passwords do not match" in str(exc.value)
