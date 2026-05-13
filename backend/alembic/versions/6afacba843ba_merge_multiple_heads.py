"""merge multiple heads

Revision ID: 6afacba843ba
Revises: 10ed1693afe0, 4a8b84f5a0a3
Create Date: 2026-05-13 07:38:50.018339

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6afacba843ba'
down_revision: Union[str, Sequence[str], None] = ('10ed1693afe0', '4a8b84f5a0a3')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
