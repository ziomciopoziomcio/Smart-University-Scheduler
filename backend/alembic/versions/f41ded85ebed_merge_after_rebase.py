"""Merge after rebase

Revision ID: f41ded85ebed
Revises: 61a8d28bddcb, ec0cb16cddbd
Create Date: 2026-05-12 15:22:12.083497

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f41ded85ebed'
down_revision: Union[str, Sequence[str], None] = ('61a8d28bddcb', 'ec0cb16cddbd')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
