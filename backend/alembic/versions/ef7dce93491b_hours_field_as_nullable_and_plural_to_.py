"""Hours field as nullable and plural to singular

Revision ID: ef7dce93491b
Revises: 69b904c7e3b4
Create Date: 2026-03-16 13:33:01.420897

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ef7dce93491b'
down_revision: Union[str, Sequence[str], None] = '69b904c7e3b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
