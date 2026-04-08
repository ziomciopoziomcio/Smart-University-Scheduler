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
from sqlalchemy import create_engine
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

from src.courses.models import Study_program, Study_fields
from src.academics.models import Students


TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
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
        else:
            print(f"WARNING: Seed file not found at {excel_path}")
    except Exception as e:
        print(f"Error while seeding database: {e}")
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

            db_session.commit()

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
    """Factory fixture to create test student with unique or specific email."""

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
