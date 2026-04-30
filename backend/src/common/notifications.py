import os
from typing import Optional

from .email_client import (
    send_email,
)


def _build_verify_link(token: str, base_url: Optional[str] = None) -> str:
    base = (base_url or os.getenv("PUBLIC_BASE_URL", "")).rstrip("/")
    if not base:
        raise RuntimeError("PUBLIC_BASE_URL is not configured")
    return f"{base}/verify-email?token={token}"


def send_verification_email(
    user_email: str, token: str, base_url: Optional[str] = None
) -> None:
    """
    Build verification link and send the verification email.

    Raises RuntimeError on misconfiguration, re-raises exceptions from send_email.
    """
    verify_link = _build_verify_link(token, base_url=base_url)

    subject = "Confirm your email"
    body = (
        "Welcome!\n\n"
        "Confirm your email by clicking this link:\n"
        f"{verify_link}\n\n"
        "If you did not create this account, ignore this email."
    )

    # send_email may raise; caller (router) should handle rollback / HTTP error
    send_email(user_email, subject, body)


def send_password_reset_email(
    user_email: str,
    token: str,
    base_url: Optional[str] = None,
    expire_minutes: int = 30,
) -> None:
    """
    Build reset link and send password reset email.
    """
    base = (base_url or os.getenv("PUBLIC_BASE_URL", "")).rstrip("/")
    if not base:
        raise RuntimeError("PUBLIC_BASE_URL is not configured")

    reset_link = f"{base}/reset-password?token={token}"
    subject = "Password reset"
    body = (
        "You requested a password reset.\n\n"
        f"Use this link to reset your password (valid for {expire_minutes} minutes):\n{reset_link}\n\n"
        "If you did not request this, you can ignore this email."
    )

    send_email(user_email, subject, body)


def send_login_credentials_email(
    user_email: str,
    temporary_password: str,
    base_url: Optional[str] = None,
) -> None:
    base = (base_url or os.getenv("PUBLIC_BASE_URL", "")).rstrip("/")
    if not base:
        raise RuntimeError("PUBLIC_BASE_URL is not configured")

    login_link = f"{base}/login"

    subject = "Welcome - your login credentials"
    body = (
        "Welcome!\n\n"
        "Your account has been created. Here are your login credentials:\n\n"
        f"Login email: {user_email}\n"
        f"Temporary password: {temporary_password}\n\n"
        "Please log in using the link below and change your password immediately:\n"
        f"{login_link}\n"
    )

    send_email(user_email, subject, body)
