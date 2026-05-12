"""Merge heads after rebase

Revision ID: 4a8b84f5a0a3
Revises: 2c5ee0d043ce, be443511b492
Create Date: 2026-05-12 21:17:51.077084

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4a8b84f5a0a3'
down_revision: Union[str, Sequence[str], None] = ('2c5ee0d043ce', 'be443511b492')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
