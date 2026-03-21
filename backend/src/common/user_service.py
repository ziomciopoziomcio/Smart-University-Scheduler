from datetime import datetime, timezone, timedelta
import logging
from fastapi import HTTPException, status, BackgroundTasks
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


def _send_verification_and_commit(
    db: Session,
    user: models.Users,
    token: str,
    background_tasks: BackgroundTasks,
):
    """
    Schedule verification email in background and commit.

    BackgroundTasks runs after the HTTP response is returned,
    so SMTP errors can't be caught here (they will be logged in send_email()).
    """
    background_tasks.add_task(send_verification_email, user.email, token)

    _commit_or_rollback(db)
    db.refresh(user)
    return user


def register_user(
    payload, background_tasks: BackgroundTasks, db: Session
) -> models.Users:
    """
    Register a user and schedule verification email in background.
    """
    _validate_signup(payload, db)
    user, token = _prepare_user_and_token(payload)
    _stage_user(db, user)
    return _send_verification_and_commit(db, user, token, background_tasks)
