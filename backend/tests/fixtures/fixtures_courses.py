import pytest
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
