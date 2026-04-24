"""merge heads

Revision ID: fb4384713a41
Revises: 40faaaf1b6b1, 4ab20155b177
Create Date: 2026-04-24 09:53:25.562908

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fb4384713a41'
down_revision: Union[str, Sequence[str], None] = ('40faaaf1b6b1', '4ab20155b177')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
