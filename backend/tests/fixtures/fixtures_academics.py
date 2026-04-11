import pytest
from datetime import date
from src.users.models import Users, Permissions, Roles
from src.academics.models import (
    Students,
    Employees,
    Units,
    Groups,
    Group_members,
    Academic_calendar,
    SemesterType,
)
from src.courses.models import (
    Study_program,
    Study_fields,
    Major,
    Elective_block,
    Course_type_detail,
    ClassType,
    FrequencyType,
    Course,
    CourseLanguage,
    Courses_instructors,
    Curriculum_course,
)


@pytest.fixture
def create_test_student(db_session):
    """Factory fixture to create test student."""

    def _create(email="student_default@test.pl", field_name="Computer Science"):

        field = db_session.query(Study_fields).filter_by(field_name=field_name).first()
        if not field:
            field = Study_fields(faculty=1, field_name=field_name)
            db_session.add(field)
            db_session.flush()

        program = Study_program(
            study_field=field.id, start_year="2025", program_name=f"Prog {field_name}"
        )
        db_session.add(program)
        db_session.flush()

        user = db_session.query(Users).filter_by(email=email).first()
        if not user:
            user = Users(
                email=email, password_hash="hash", name="Test", surname="Student"
            )
            db_session.add(user)
            db_session.flush()

        student = Students(user_id=user.id, study_program=program.id)
        db_session.add(student)
        db_session.commit()
        return student

    return _create


@pytest.fixture
def create_test_employee(db_session):
    """Factory fixture to create test employee."""

    def _create(email="employee@test.pl", unit_name="Test Unit"):

        faculty_id = 1

        unit = db_session.query(Units).filter_by(unit_name=unit_name).first()
        if not unit:
            unit = Units(
                unit_name=unit_name,
                unit_short=unit_name[:5].upper(),
                faculty_id=faculty_id,
            )
            db_session.add(unit)
            db_session.flush()

        user = db_session.query(Users).filter_by(email=email).first()
        if not user:
            user = Users(
                email=email,
                password_hash="hash",
                name="Test",
                surname="Employee",
                email_verified=True,
            )
            db_session.add(user)
            db_session.flush()

        employee = (
            db_session.query(Employees)
            .filter_by(user_id=user.id, unit_id=unit.id, faculty_id=faculty_id)
            .first()
        )

        if not employee:
            employee = Employees(
                user_id=user.id, faculty_id=faculty_id, unit_id=unit.id
            )
            db_session.add(employee)
            db_session.commit()

        return employee

    return _create


@pytest.fixture
def create_test_unit(db_session):
    """Factory fixture to create a test unit."""

    def _create(
        unit_name="Institute of Artificial Intelligence", unit_short="IAI", faculty_id=1
    ):
        unit = db_session.query(Units).filter_by(unit_name=unit_name).first()

        if not unit:
            unit = Units(
                unit_name=unit_name, unit_short=unit_short, faculty_id=faculty_id
            )
            db_session.add(unit)
            db_session.commit()
            db_session.refresh(unit)

        return unit

    return _create


@pytest.fixture
def create_test_group(db_session):
    """Factory fixture to create a test group."""

    def _create(
        group_name="Test Group A",
        study_program_id=None,
        major_id=None,
        elective_block_id=None,
    ):

        if study_program_id is None:
            program = db_session.query(Study_program).first()
            if not program:
                program = Study_program(
                    study_field=1, start_year="2025", program_name="Default Program"
                )
                db_session.add(program)
                db_session.flush()
            study_program_id = program.id

        group = db_session.query(Groups).filter_by(group_name=group_name).first()

        if not group:
            group = Groups(
                group_name=group_name,
                study_program=study_program_id,
                major=major_id,
                elective_block=elective_block_id,
            )

            db_session.add(group)
            db_session.commit()
            db_session.refresh(group)

        return group

    return _create


@pytest.fixture
def create_test_group_member(db_session, create_test_group, create_test_student):
    """Factory fixture to create a membership between a group and a student."""

    def _create(group_id=None, student_id=None):
        if group_id is None:
            group = create_test_group(group_name="Default Membership Group")
            group_id = group.id

        if student_id is None:
            student = create_test_student(email="member@test.pl")
            student_id = student.id

        member = (
            db_session.query(Group_members)
            .filter_by(group=group_id, student=student_id)
            .first()
        )

        if not member:
            member = Group_members(group=group_id, student=student_id)
            db_session.add(member)
            db_session.commit()
            db_session.refresh(member)

        return member

    return _create


@pytest.fixture
def create_test_calendar_day(db_session):
    """Factory fixture to create a test calendar day."""

    def _create(
        date_val="2026-10-01", description="Inauguration", week_num=1, day_of_week=1
    ):

        if isinstance(date_val, str):  # SQLite exclusive
            date_val = date.fromisoformat(date_val)

        day = (
            db_session.query(Academic_calendar)
            .filter_by(calendar_date=date_val)
            .first()
        )
        if not day:
            day = Academic_calendar(
                calendar_date=date_val,
                academic_year="2025/2026",
                semester_type=SemesterType.WINTER,
                week_number=week_num,
                academic_day_of_week=day_of_week,
                description=description,
            )
            db_session.add(day)
            db_session.commit()
            db_session.refresh(day)
        return day

    return _create
