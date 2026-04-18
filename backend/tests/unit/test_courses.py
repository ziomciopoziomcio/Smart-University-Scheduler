import pytest
from pydantic import ValidationError

# Adjust imports to match your directory structure
from src.courses.schemas import (
    CurriculumCourseCreate,
    CurriculumCourseUpdate,
    CourseCreate,
    CourseTypeDetailCreate,
    CourseInstructorCreate,
)
from src.courses.models import CourseLanguage, ClassType


def test_curriculum_course_validator_success():
    """Tests valid cases: only major, only elective block, or neither."""
    # 1. Assigned only to Major (success)
    valid_major = CurriculumCourseCreate(
        study_program=1, course=101, semester=1, major=5, elective_block=None
    )
    assert valid_major.major == 5
    assert valid_major.elective_block is None

    # 2. Assigned only to Elective Block (success)
    valid_elective = CurriculumCourseCreate(
        study_program=1, course=101, semester=1, major=None, elective_block=3
    )
    assert valid_elective.elective_block == 3

    # 3. General mandatory course (success)
    valid_none = CurriculumCourseCreate(
        study_program=1, course=101, semester=1, major=None, elective_block=None
    )
    assert valid_none.major is None


def test_curriculum_course_validator_failure():
    """Tests if the validator raises an error when BOTH values are provided."""
    with pytest.raises(ValidationError) as exc:
        CurriculumCourseCreate(
            study_program=1, course=101, semester=1, major=5, elective_block=3
        )

    assert "Course cannot belong to both a major and an elective block" in str(
        exc.value
    )


def test_curriculum_course_update_validator_failure():
    """Tests the same mutual exclusion logic for the Update schema."""
    with pytest.raises(ValidationError) as exc:
        CurriculumCourseUpdate(major=2, elective_block=4)

    assert "Course cannot belong to both a major and an elective block" in str(
        exc.value
    )


def test_curriculum_course_semester_gt_zero():
    """Tests the limit for the semester field (must be > 0)."""
    with pytest.raises(ValidationError) as exc:
        CurriculumCourseCreate(study_program=1, course=101, semester=0)

    assert "Input should be greater than 0" in str(exc.value)


def test_course_ects_points_limits():
    """Tests the ECTS limit (cannot be negative)."""
    # Success (0 is acceptable)
    valid_course = CourseCreate(
        course_code=100,
        ects_points=0,
        course_name="Test",
        course_language=CourseLanguage.POLISH,
        leading_unit=1,
        course_coordinator=1,
    )
    assert valid_course.ects_points == 0

    # Error (negative ECTS)
    with pytest.raises(ValidationError) as exc:
        CourseCreate(
            course_code=100,
            ects_points=-1,
            course_name="Test",
            course_language=CourseLanguage.POLISH,
            leading_unit=1,
            course_coordinator=1,
        )
    assert "Input should be greater than or equal to 0" in str(exc.value)


def test_course_type_detail_slots_limits():
    """Tests if slots_per_class falls within the 1-10 range."""
    base_data = {
        "course": 101,
        "class_type": ClassType.LECTURE,
        "class_hours": 30,
        "max_group_participants_number": 15,
    }

    # Too few slots
    with pytest.raises(ValidationError) as exc_low:
        CourseTypeDetailCreate(**base_data, slots_per_class=0)
    assert "Input should be greater than or equal to 1" in str(exc_low.value)

    # Too many slots
    with pytest.raises(ValidationError) as exc_high:
        CourseTypeDetailCreate(**base_data, slots_per_class=11)
    assert "Input should be less than or equal to 10" in str(exc_high.value)

    # Valid slots
    valid = CourseTypeDetailCreate(**base_data, slots_per_class=10)
    assert valid.slots_per_class == 10


def test_course_type_detail_group_size():
    """Tests the group size limit (> 0)."""
    with pytest.raises(ValidationError):
        CourseTypeDetailCreate(
            course=101, class_type=ClassType.LECTURE, max_group_participants_number=0
        )


def test_course_instructor_hours_limit():
    """Tests that the instructor is not assigned negative hours."""
    with pytest.raises(ValidationError):
        CourseInstructorCreate(
            employee=1, course=101, class_type=ClassType.LABORATORY, hours=-5
        )
