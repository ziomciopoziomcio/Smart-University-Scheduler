"""In courses_instructors change min_hours and max_hours to hours and remove priority

Revision ID: 69b904c7e3b4
Revises: d6b412ffc363
Create Date: 2026-03-15 15:54:36.463975

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '69b904c7e3b4'
down_revision: Union[str, Sequence[str], None] = 'd6b412ffc363'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
