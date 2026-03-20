from datetime import datetime, timezone, timedelta
import logging
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.common.router_utils import _commit_or_rollback
from src.users import models
from src.users.auth import hash_password, create_email_verification_token, _hash_token
from src.common.notifications import send_verification_email
from src.common.logging_utils import mask_email

logger = logging.getLogger(__name__)


def _validate_signup(payload, db: Session) -> None:
    """Raise HTTPException for basic validation errors."""
    existing = (
        db.query(models.Users).filter(models.Users.email == payload.email).first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists",
        )


def _prepare_user_and_token(payload):
    """Create Users instance and a plaintext token (not persisted)."""

    user = models.Users(
        email=payload.email,
        password_hash=hash_password(payload.password),
        name=payload.name,
        surname=payload.surname,
        phone_number=payload.phone_number,
        degree=payload.degree,
    )
    token = create_email_verification_token()
    user.email_verified = False
    user.email_verification_token_hash = _hash_token(token)
    user.email_verification_expires_at = datetime.now(timezone.utc) + timedelta(
        hours=24
    )
    return user, token


def _stage_user(db: Session, user: models.Users) -> None:
    """Add user to session and flush to get id (no commit)."""
    db.add(user)
    db.flush()


def _send_verification_and_commit(db: Session, user: models.Users, token: str):
    """
    Try to send verification email and commit on success.
    On failure rollback and raise HTTPException.
    """

    try:
        send_verification_email(user.email, token)
    except RuntimeError as e:
        db.rollback()
        logger.error("Verification email configuration error: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
    except Exception as e:
        db.rollback()
        masked = mask_email(getattr(user, "email", None))
        logger.error(
            "Failed to send verification email (user_id=%s, email=%s, err=%s)",
            getattr(user, "id", "unknown"),
            masked,
            type(e).__name__,
        )
        logger.debug("Full exception sending verification email", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email",
        )

    _commit_or_rollback(db)
    db.refresh(user)
    return user


def register_user(payload, db: Session) -> models.Users:
    """
    Public function to register a user:
    - validate
    - prepare user + token
    - stage (flush)
    - send verification email (only then commit)
    Returns the created user (refreshed).
    """
    _validate_signup(payload, db)
    user, token = _prepare_user_and_token(payload)
    _stage_user(db, user)
    return _send_verification_and_commit(db, user, token)
