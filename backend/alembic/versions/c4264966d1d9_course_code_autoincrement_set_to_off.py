"""course_code autoincrement set to off

Revision ID: c4264966d1d9
Revises: a27c0606ed3e
Create Date: 2026-03-26 20:15:27.272465

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "c4264966d1d9"
down_revision: Union[str, Sequence[str], None] = "a27c0606ed3e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TABLE courses ALTER COLUMN course_code DROP DEFAULT")


def downgrade() -> None:
    """Downgrade schema."""
    pass
