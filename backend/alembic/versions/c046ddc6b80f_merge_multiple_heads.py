"""Merge multiple heads

Revision ID: c046ddc6b80f
Revises: 34154a654db6, d95cacf97cc2
Create Date: 2026-03-22 19:02:30.125608

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c046ddc6b80f'
down_revision: Union[str, Sequence[str], None] = ('34154a654db6', 'd95cacf97cc2')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
