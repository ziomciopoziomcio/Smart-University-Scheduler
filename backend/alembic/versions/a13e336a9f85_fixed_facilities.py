"""Fixed facilities

Revision ID: a13e336a9f85
Revises: d6b412ffc363
Create Date: 2026-03-15 13:08:09.274134

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a13e336a9f85'
down_revision: Union[str, Sequence[str], None] = 'd6b412ffc363'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # rename existing tables instead of drop/create
    op.rename_table('campus', 'campuses')
    op.rename_table('faculty', 'faculties')

    op.create_table(
        'study_programs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('study_field', sa.Integer(), nullable=False),
        sa.Column('start_year', sa.String(length=20), nullable=False),
        sa.Column('program_name', sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(['study_field'], ['study_fields.id']),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'curriculum_courses',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('study_program', sa.Integer(), nullable=False),
        sa.Column('course', sa.Integer(), nullable=False),
        sa.Column('semester', sa.Integer(), nullable=False),
        sa.Column('major', sa.Integer(), nullable=True),
        sa.Column('elective_block', sa.Integer(), nullable=True),
        sa.CheckConstraint(
            '(major IS NULL) OR (elective_block IS NULL)',
            name='chk_curriculum_major_elective'
        ),
        sa.ForeignKeyConstraint(['course'], ['courses.course_code']),
        sa.ForeignKeyConstraint(['elective_block'], ['elective_block.id']),
        sa.ForeignKeyConstraint(['major'], ['major.id']),
        sa.ForeignKeyConstraint(['study_program'], ['study_programs.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('study_program', 'course', 'semester', name='uq_program_course_semester')
    )

    op.create_unique_constraint('uq_buildings_building_name', 'buildings', ['building_name'])

    op.drop_constraint(op.f('buildings_campus_id_fkey'), 'buildings', type_='foreignkey')
    op.create_foreign_key(
        'buildings_campus_id_fkey',
        'buildings',
        'campuses',
        ['campus_id'],
        ['id']
    )

    op.drop_constraint(op.f('courses_major_fkey'), 'courses', type_='foreignkey')
    op.drop_constraint(op.f('courses_study_field_fkey'), 'courses', type_='foreignkey')
    op.drop_constraint(op.f('courses_elective_block_fkey'), 'courses', type_='foreignkey')
    op.drop_column('courses', 'major')
    op.drop_column('courses', 'study_field')
    op.drop_column('courses', 'elective_block')

    op.drop_constraint(op.f('employees_faculty_id_fkey'), 'employees', type_='foreignkey')
    op.create_foreign_key(
        'employees_faculty_id_fkey',
        'employees',
        'faculties',
        ['faculty_id'],
        ['id']
    )

    op.drop_constraint(op.f('faculty_buildings_faculty_id_fkey'), 'faculty_buildings', type_='foreignkey')
    op.create_foreign_key(
        'faculty_buildings_faculty_id_fkey',
        'faculty_buildings',
        'faculties',
        ['faculty_id'],
        ['id']
    )

    op.add_column('groups', sa.Column('study_program', sa.Integer(), nullable=False))
    op.drop_constraint(op.f('groups_study_field_fkey'), 'groups', type_='foreignkey')
    op.create_foreign_key(
        'groups_study_program_fkey',
        'groups',
        'study_programs',
        ['study_program'],
        ['id']
    )
    op.drop_column('groups', 'study_field')

    op.add_column('rooms', sa.Column('faculty_id', sa.Integer(), nullable=False))
    op.create_foreign_key(
        'rooms_faculty_id_fkey',
        'rooms',
        'faculties',
        ['faculty_id'],
        ['id']
    )

    op.add_column('students', sa.Column('study_program', sa.Integer(), nullable=False))
    op.drop_constraint(op.f('uq_students_user_id'), 'students', type_='unique')
    op.create_unique_constraint('uq_students_user_id', 'students', ['user_id', 'study_program'])
    op.drop_constraint(op.f('students_study_field_fkey'), 'students', type_='foreignkey')
    op.create_foreign_key(
        'students_study_program_fkey',
        'students',
        'study_programs',
        ['study_program'],
        ['id']
    )
    op.drop_column('students', 'study_field')

    op.drop_constraint(op.f('study_fields_faculty_fkey'), 'study_fields', type_='foreignkey')
    op.create_foreign_key(
        'study_fields_faculty_fkey',
        'study_fields',
        'faculties',
        ['faculty'],
        ['id']
    )

    op.drop_constraint(op.f('units_faculty_id_fkey'), 'units', type_='foreignkey')
    op.create_foreign_key(
        'units_faculty_id_fkey',
        'units',
        'faculties',
        ['faculty_id'],
        ['id']
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_constraint('units_faculty_id_fkey', 'units', type_='foreignkey')
    op.create_foreign_key(
        'units_faculty_id_fkey',
        'units',
        'faculty',
        ['faculty_id'],
        ['id']
    )

    op.drop_constraint('study_fields_faculty_fkey', 'study_fields', type_='foreignkey')
    op.create_foreign_key(
        'study_fields_faculty_fkey',
        'study_fields',
        'faculty',
        ['faculty'],
        ['id']
    )

    op.add_column('students', sa.Column('study_field', sa.INTEGER(), nullable=False))
    op.drop_constraint('students_study_program_fkey', 'students', type_='foreignkey')
    op.create_foreign_key(
        'students_study_field_fkey',
        'students',
        'study_fields',
        ['study_field'],
        ['id']
    )
    op.drop_constraint('uq_students_user_id', 'students', type_='unique')
    op.create_unique_constraint('uq_students_user_id', 'students', ['user_id', 'study_field'])
    op.drop_column('students', 'study_program')

    op.drop_constraint('rooms_faculty_id_fkey', 'rooms', type_='foreignkey')
    op.drop_column('rooms', 'faculty_id')

    op.add_column('groups', sa.Column('study_field', sa.INTEGER(), nullable=False))
    op.drop_constraint('groups_study_program_fkey', 'groups', type_='foreignkey')
    op.create_foreign_key(
        'groups_study_field_fkey',
        'groups',
        'study_fields',
        ['study_field'],
        ['id']
    )
    op.drop_column('groups', 'study_program')

    op.drop_constraint('faculty_buildings_faculty_id_fkey', 'faculty_buildings', type_='foreignkey')
    op.create_foreign_key(
        'faculty_buildings_faculty_id_fkey',
        'faculty_buildings',
        'faculty',
        ['faculty_id'],
        ['id']
    )

    op.drop_constraint('employees_faculty_id_fkey', 'employees', type_='foreignkey')
    op.create_foreign_key(
        'employees_faculty_id_fkey',
        'employees',
        'faculty',
        ['faculty_id'],
        ['id']
    )

    op.add_column('courses', sa.Column('elective_block', sa.INTEGER(), nullable=True))
    op.add_column('courses', sa.Column('study_field', sa.INTEGER(), nullable=False))
    op.add_column('courses', sa.Column('major', sa.INTEGER(), nullable=True))
    op.create_foreign_key('courses_elective_block_fkey', 'courses', 'elective_block', ['elective_block'], ['id'])
    op.create_foreign_key('courses_study_field_fkey', 'courses', 'study_fields', ['study_field'], ['id'])
    op.create_foreign_key('courses_major_fkey', 'courses', 'major', ['major'], ['id'])

    op.drop_constraint('buildings_campus_id_fkey', 'buildings', type_='foreignkey')
    op.create_foreign_key(
        'buildings_campus_id_fkey',
        'buildings',
        'campus',
        ['campus_id'],
        ['id']
    )

    op.drop_constraint('uq_buildings_building_name', 'buildings', type_='unique')

    op.drop_table('curriculum_courses')
    op.drop_table('study_programs')

    # rename tables back instead of drop/create
    op.rename_table('faculties', 'faculty')
    op.rename_table('campuses', 'campus')