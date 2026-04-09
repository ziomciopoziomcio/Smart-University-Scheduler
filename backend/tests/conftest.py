import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# SQLAlchemy
os.environ["DB_HOST"] = "localhost"
os.environ["DB_PORT"] = "5432"
os.environ["DB_USER"] = "test_user"
os.environ["DB_PASSWORD"] = "test_pass"
os.environ["DB_NAME"] = "test_db"

# Neo4j
os.environ["NEO4J_HOST"] = "localhost"
os.environ["NEO4J_PORT"] = "7687"
os.environ["NEO4J_USER"] = "neo4j"
os.environ["NEO4J_PASSWORD"] = "test_pass"

# Security & JWT
os.environ["SECRET_KEY"] = "very-very-very-strong-test-key-12345"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "60"

# SMTP & others
os.environ["SMTP_HOST"] = "localhost"
os.environ["SMTP_PORT"] = "587"
os.environ["SMTP_USER"] = "test@gmail.com"
os.environ["SMTP_PASSWORD"] = "pass"
os.environ["SMTP_FROM"] = "Test <no-reply@test.pl>"
os.environ["PUBLIC_BASE_URL"] = "http://localhost:3000"
os.environ["CORS_ORIGINS"] = "http://localhost:3000"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker
from main import app
from src.database.database import get_db
from src.database.base import Base
from src.users import models as user_models
from src.users.auth import create_access_token

from helpers.db_seeder.generators.roles_perms import (
    generate_permissions_from_excel_file,
    generate_roles_from_excel_file,
)

from src.courses.models import Study_program, Study_fields, Major, Elective_block
from src.academics.models import Students, Employees, Units, Groups, Group_members
from src.users.models import Users


TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Sets up test DB and seeds roles/permissions. Executes once."""

    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()
    try:
        excel_path = (
            PROJECT_ROOT / "helpers" / "db_seeder" / "data" / "role_uprawnienia.xlsx"
        )
        if excel_path.exists():

            permissions = generate_permissions_from_excel_file(
                session=session, sourcefile=str(excel_path), sheet_name="Arkusz1"
            )
            generate_roles_from_excel_file(
                session=session,
                sourcefile=str(excel_path),
                sheet_name="Arkusz1",
                permissions=permissions,
            )
            session.commit()
            print("\n[INFO] Database seeded successfully.")
    except Exception as e:
        print(f"\n[ERROR] Error occured during database seeding: {e}")
        session.rollback()
    finally:
        session.close()

    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    """Sets up clear DB session. Executes before every test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """Replaces FastApi's base with test client."""

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def get_auth_headers(db_session):

    def _get_headers(role_name: str, additional_permissions: list[str] = None):

        role = (
            db_session.query(user_models.Roles).filter_by(role_name=role_name).first()
        )
        if not role:
            role = user_models.Roles(role_name=role_name)
            db_session.add(role)
            db_session.commit()

        if additional_permissions:
            for code in additional_permissions:
                perm = (
                    db_session.query(user_models.Permissions)
                    .filter_by(code=code)
                    .first()
                )
                if not perm:
                    perm = user_models.Permissions(code=code, name=code)
                    db_session.add(perm)

                if perm not in role.permissions:
                    role.permissions.append(perm)

            db_session.flush()
            db_session.refresh(role)

        user_email = f"{role_name.replace(' ', '_').lower()}@test.pl"
        user = db_session.query(user_models.Users).filter_by(email=user_email).first()

        if not user:
            user = user_models.Users(
                email=user_email,
                password_hash="fake_hash",
                name="Test",
                surname=role_name,
                email_verified=True,
            )
            user.roles.append(role)
            db_session.add(user)
            db_session.commit()

        token = create_access_token(data={"sub": str(user.id)})
        return {"Authorization": f"Bearer {token}"}

    return _get_headers


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

        user = db_session.query(user_models.Users).filter_by(email=email).first()
        if not user:
            user = user_models.Users(
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

        user = db_session.query(user_models.Users).filter_by(email=email).first()
        if not user:
            user = user_models.Users(
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
def create_test_study_field(db_session):
    """Factory fixture to create a test study field."""

    def _create(field_name="Informatyka", faculty_id=1):
        obj = db_session.query(Study_fields).filter_by(field_name=field_name).first()
        if not obj:
            obj = Study_fields(faculty=faculty_id, field_name=field_name)
            db_session.add(obj)
            db_session.commit()
            db_session.refresh(obj)
        return obj

    return _create


@pytest.fixture
def create_test_major(db_session, create_test_study_field):
    def _create(major_name="Software Engineering", study_field_id=None):
        if study_field_id is None:
            field = create_test_study_field(field_name=f"Field_for_{major_name}")
            study_field_id = field.id
        obj = Major(major_name=major_name, study_field=study_field_id)
        db_session.add(obj)
        db_session.commit()
        db_session.refresh(obj)
        return obj

    return _create
