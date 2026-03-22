"""Merge multiple heads

Revision ID: 34154a654db6
Revises: 205f63cebe26, 37622c66ff7f
Create Date: 2026-03-22 18:41:48.568365

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '34154a654db6'
down_revision: Union[str, Sequence[str], None] = ('205f63cebe26', '37622c66ff7f')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
