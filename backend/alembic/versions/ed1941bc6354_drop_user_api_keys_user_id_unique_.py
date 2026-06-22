"""drop_user_api_keys_user_id_unique_constraint

Revision ID: ed1941bc6354
Revises: fa0c1a493f77
Create Date: 2026-06-22 16:45:11.727027

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ed1941bc6354'
down_revision: Union[str, Sequence[str], None] = 'fa0c1a493f77'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_constraint('user_api_keys_user_id_key', 'user_api_keys', type_='unique')


def downgrade() -> None:
    """Downgrade schema."""
    op.create_unique_constraint('user_api_keys_user_id_key', 'user_api_keys', ['user_id'])
