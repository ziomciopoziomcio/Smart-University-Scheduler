"""add custom_events table

Revision ID: 688d899652d6
Revises: 0b3c0ed67aaa
Create Date: 2026-06-01 11:22:42.039174

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "688d899652d6"
down_revision: Union[str, Sequence[str], None] = "0b3c0ed67aaa"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "custom_events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=1024), nullable=True),
        sa.Column(
            "event_type",
            sa.Enum("PERSONAL", "MEETING", "PROJECT", "OTHER", name="customeventtype"),
            nullable=False,
        ),
        sa.Column("start_dt", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_dt", sa.DateTime(timezone=True), nullable=False),
        sa.Column("related_group_id", sa.Integer(), nullable=True),
        sa.Column("related_room_id", sa.Integer(), nullable=True),
        sa.Column("related_session_id", sa.Uuid(), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("start_dt <= end_dt", name="chk_custom_events_dates"),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["related_group_id"],
            ["groups.id"],
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_custom_events_event_id"), "custom_events", ["event_id"], unique=True
    )
    op.create_index(
        op.f("ix_custom_events_user_id"), "custom_events", ["user_id"], unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_custom_events_user_id"), table_name="custom_events")
    op.drop_index(op.f("ix_custom_events_event_id"), table_name="custom_events")
    op.drop_table("custom_events")
    sa.Enum("PERSONAL", "MEETING", "PROJECT", "OTHER", name="customeventtype").drop(
        op.get_bind()
    )
