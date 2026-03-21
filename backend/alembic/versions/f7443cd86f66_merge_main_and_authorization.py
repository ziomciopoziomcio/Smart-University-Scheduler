"""merge main and authorization

Revision ID: f7443cd86f66
Revises: d232061aff4c, fb600057d27c
Create Date: 2026-03-21 12:17:19.549850

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f7443cd86f66'
down_revision: Union[str, Sequence[str], None] = ('d232061aff4c', 'fb600057d27c')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
