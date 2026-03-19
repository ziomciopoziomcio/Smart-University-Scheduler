"""
Tables:
- User
- Roles
- User_roles
"""

from datetime import datetime

from sqlalchemy import (
    String,
    DateTime,
    text,
    Table,
    Column,
    Integer,
    ForeignKey,
    Boolean,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database.base import Base

user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id"), primary_key=True),
)


class Users(Base):
    """User model representing a user in the system."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True)  # Citext
    phone_number: Mapped[str | None] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()")
    )
    name: Mapped[str] = mapped_column(String(255))
    surname: Mapped[str] = mapped_column(String(255))
    degree: Mapped[str | None] = mapped_column(String(255))

    two_factor_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    two_factor_secret: Mapped[str | None] = mapped_column(String(64), nullable=True)
    backup_codes: Mapped[str | None] = mapped_column(Text, nullable=True)

    password_reset_token_hash: Mapped[str | None] = mapped_column(
        String(64), nullable=True
    )
    password_reset_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    roles: Mapped[list["Roles"]] = relationship(
        secondary=user_roles, back_populates="users"
    )


class Roles(Base):
    """Roles model representing a role in the system."""

    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    role_name: Mapped[str] = mapped_column(String(255), unique=True)

    users: Mapped[list["Users"]] = relationship(
        secondary=user_roles, back_populates="roles"
    )
