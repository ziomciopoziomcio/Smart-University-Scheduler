"""Add api_key_hash

Revision ID: 0e34a8750156
Revises: 0b3c0ed67aaa
Create Date: 2026-06-01 15:50:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0e34a8750156"
down_revision: Union[str, None] = "0b3c0ed67aaa"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users", sa.Column("api_key_hash", sa.String(length=64), nullable=True)
    )
    op.create_index(
        op.f("ix_users_api_key_hash"), "users", ["api_key_hash"], unique=True
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_users_api_key_hash"), table_name="users")
    op.drop_column("users", "api_key_hash")
