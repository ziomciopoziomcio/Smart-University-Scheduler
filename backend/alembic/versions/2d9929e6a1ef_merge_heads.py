"""merge heads

Revision ID: 2d9929e6a1ef
Revises: be443511b492, f41ded85ebed
Create Date: 2026-05-12 21:23:01.237765

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2d9929e6a1ef'
down_revision: Union[str, Sequence[str], None] = ('be443511b492', 'f41ded85ebed')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
