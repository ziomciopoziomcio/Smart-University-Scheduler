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
from src.users.auth import create_access_token, hash_password

from helpers.db_seeder.generators.roles_perms import (
    generate_permissions_from_excel_file,
    generate_roles_from_excel_file,
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
from src.academics.models import Students, Employees, Units, Groups, Group_members
from src.users.models import Users, Permissions, Roles
from src.facilities.models import Campus, Building, Faculty, Room

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
    """Factory fixture to create a test major."""

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


@pytest.fixture
def create_test_elective_block(db_session, create_test_study_field):
    """Factory fixture to create a test elective block."""

    def _create(block_name="Mobile Technologies", study_field_id=None):
        if study_field_id is None:
            field = create_test_study_field(field_name=f"Field_for_{block_name}")
            study_field_id = field.id
        obj = Elective_block(elective_block_name=block_name, study_field=study_field_id)
        db_session.add(obj)
        db_session.commit()
        db_session.refresh(obj)
        return obj

    return _create


@pytest.fixture
def create_test_course(db_session, create_test_unit, create_test_employee):
    """Factory fixture to create a test course."""

    def _create(course_code=1000, course_name="Test Course"):

        course = db_session.query(Course).filter_by(course_code=course_code).first()
        if not course:
            unit = create_test_unit()
            coordinator = create_test_employee(
                email=f"coordinator_{course_code}@test.pl"
            )

            course = Course(
                course_code=course_code,
                ects_points=5,
                course_name=course_name,
                course_language=CourseLanguage.POLISH,
                leading_unit=unit.id,
                course_coordinator=coordinator.id,
            )
            db_session.add(course)
            db_session.commit()
            db_session.refresh(course)

        return course

    return _create


@pytest.fixture
def create_test_course_type(db_session, create_test_course):
    """Factory fixture to create a test course type detail."""

    def _create(course_code=None, class_type="Lecture"):

        if course_code is None:
            course = create_test_course()
            course_code = course.course_code

        c_type = getattr(ClassType, class_type.upper(), ClassType.LECTURE)

        obj = (
            db_session.query(Course_type_detail)
            .filter_by(course=course_code, class_type=c_type)
            .first()
        )

        if not obj:
            obj = Course_type_detail(
                course=course_code,
                class_type=c_type,
                class_hours=30,
                slots_per_class=2,
                frequency=FrequencyType.EVERY_WEEK,
                pc_needed=False,
                projector_needed=True,
                max_group_participants_number=15,
            )
            db_session.add(obj)
            db_session.commit()
            db_session.refresh(obj)

        return obj

    return _create


@pytest.fixture
def create_test_course_instructor(
    db_session, create_test_employee, create_test_course_type
):
    """Factory fixture to create a test course instructor assignment."""

    def _create(
        employee_email="inst_default@test.pl", course_code=None, class_type="Lecture"
    ):

        c_type_detail = create_test_course_type(
            course_code=course_code, class_type=class_type
        )

        employee = create_test_employee(email=employee_email)

        obj = (
            db_session.query(Courses_instructors)
            .filter_by(
                employee=employee.id,
                course=c_type_detail.course,
                class_type=c_type_detail.class_type,
            )
            .first()
        )

        if not obj:
            obj = Courses_instructors(
                employee=employee.id,
                course=c_type_detail.course,
                class_type=c_type_detail.class_type,
                hours=30,
            )
            db_session.add(obj)
            db_session.commit()
            db_session.refresh(obj)

        return obj

    return _create


@pytest.fixture
def create_test_study_program(db_session, create_test_study_field):
    """Factory fixture to create a test study program."""

    def _create(
        program_name="Default Program", start_year="2024/2025", study_field_id=None
    ):

        if study_field_id is None:
            safe_name = program_name.replace(" ", "_")
            field = create_test_study_field(field_name=f"Field_for_{safe_name}")
            study_field_id = field.id

        obj = (
            db_session.query(Study_program).filter_by(program_name=program_name).first()
        )

        if not obj:
            obj = Study_program(
                study_field=study_field_id,
                start_year=start_year,
                program_name=program_name,
            )
            db_session.add(obj)
            db_session.commit()
            db_session.refresh(obj)

        return obj

    return _create


@pytest.fixture
def create_test_curriculum(db_session, create_test_study_program, create_test_course):
    """Factory fixture to create a test curriculum course."""

    def _create(program_name="Curriculum Program", course_code=None, semester=1):

        program = create_test_study_program(program_name=program_name)

        if course_code is None:
            course = create_test_course(
                course_code=9999, course_name="Curriculum Default Course"
            )
            course_code = course.course_code
        else:
            course = create_test_course(course_code=course_code)

        obj = (
            db_session.query(Curriculum_course)
            .filter_by(study_program=program.id, course=course_code, semester=semester)
            .first()
        )

        if not obj:
            obj = Curriculum_course(
                study_program=program.id,
                course=course_code,
                semester=semester,
                major=None,
                elective_block=None,
            )
            db_session.add(obj)
            db_session.commit()
            db_session.refresh(obj)

        return obj

    return _create


@pytest.fixture
def create_test_campus(db_session):
    """Factory fixture to create a test campus."""

    def _create(campus_name="Main Campus", campus_short="MAIN"):

        campus = db_session.query(Campus).filter_by(campus_name=campus_name).first()
        if not campus:
            campus = Campus(campus_name=campus_name, campus_short=campus_short)
            db_session.add(campus)
            db_session.commit()
            db_session.refresh(campus)
        return campus

    return _create


@pytest.fixture
def create_test_building(db_session, create_test_campus):
    """Factory fixture to create a test building."""

    def _create(
        building_number="B18",
        building_name="Information Technologies Center",
        campus_id=None,
    ):

        if campus_id is None:
            safe_num = building_number.replace(" ", "_")
            campus = create_test_campus(
                campus_name=f"Campus_for_{safe_num}", campus_short=f"C_{safe_num}"
            )
            campus_id = campus.id

        building = (
            db_session.query(Building)
            .filter_by(building_number=building_number)
            .first()
        )
        if not building:
            building = Building(
                building_number=building_number,
                building_name=building_name,
                campus_id=campus_id,
            )
            db_session.add(building)
            db_session.commit()
            db_session.refresh(building)

        return building

    return _create


@pytest.fixture
def create_test_faculty(db_session):
    """Factory fixture to create a test faculty."""

    def _create(faculty_name="Faculty of Test", faculty_short="FT"):

        faculty = db_session.query(Faculty).filter_by(faculty_name=faculty_name).first()
        if not faculty:
            faculty = Faculty(faculty_name=faculty_name, faculty_short=faculty_short)
            db_session.add(faculty)
            db_session.commit()
            db_session.refresh(faculty)

        return faculty

    return _create


@pytest.fixture
def create_test_room(db_session, create_test_building, create_test_faculty):
    """Factory fixture to create a test room."""

    def _create(room_name="101A", building_id=None, faculty_id=None):

        if building_id is None:
            safe_b = room_name.replace(" ", "_")
            building = create_test_building(
                building_number=f"B_Room_{safe_b}",
                building_name=f"Building for {safe_b}",
            )
            building_id = building.id

        if faculty_id is None:
            safe_f = room_name.replace(" ", "_")
            faculty = create_test_faculty(
                faculty_name=f"Faculty_{safe_f}", faculty_short=f"F_{safe_f}"
            )
            faculty_id = faculty.id

        room = (
            db_session.query(Room)
            .filter_by(room_name=room_name, building_id=building_id)
            .first()
        )
        if not room:
            room = Room(
                room_name=room_name,
                building_id=building_id,
                faculty_id=faculty_id,
                pc_amount=15,
                room_capacity=30,
                projector_availability=True,
            )
            db_session.add(room)
            db_session.commit()
            db_session.refresh(room)

        return room

    return _create


@pytest.fixture
def create_test_role(db_session):
    """Factory fixture to create a test role."""

    def _create(role_name="Dummy Role"):
        role = db_session.query(Roles).filter_by(role_name=role_name).first()
        if not role:
            role = Roles(role_name=role_name)
            db_session.add(role)
            db_session.commit()
            db_session.refresh(role)
        return role

    return _create


@pytest.fixture
def create_test_permission(db_session):
    """Factory fixture to create a test permission."""

    def _create(code="dummy:perm", name="Dummy Perm"):
        perm = db_session.query(Permissions).filter_by(code=code).first()
        if not perm:
            perm = Permissions(code=code, name=name)
            db_session.add(perm)
            db_session.commit()
            db_session.refresh(perm)
        return perm

    return _create


@pytest.fixture
def create_test_user(db_session):
    """Factory fixture to create a plain test user."""

    def _create(email="plain_user@test.pl", name="Plain", surname="User"):
        user = db_session.query(Users).filter_by(email=email).first()
        if not user:
            user = Users(
                email=email,
                password_hash="fake_hash",
                name=name,
                surname=surname,
                email_verified=True,
            )
            db_session.add(user)
            db_session.commit()
            db_session.refresh(user)
        return user

    return _create


@pytest.fixture
def create_auth_user(db_session):
    """Factory fixture to create a user with a valid hashed password for login tests."""

    def _create(email="login@test.pl", password="StrongPassword123!"):

        user = db_session.query(Users).filter_by(email=email).first()
        if not user:
            user = Users(
                email=email,
                password_hash=hash_password(password),
                name="Auth",
                surname="User",
                email_verified=True,
            )
            db_session.add(user)
            db_session.commit()
            db_session.refresh(user)
        return user, password

    return _create
