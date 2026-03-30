import random
import re

from sqlalchemy.orm import Session
import json

from backend.src.courses.models import ClassType, Course_type_detail, Course


from backend.src.courses.models import Study_fields
from backend.src.facilities.models import Faculty


def generate_study_fields(
    session: Session,
    faculties: dict[str, Faculty],
    sourcefile="../../../helpers/data_collector/final-programy.json",
) -> dict[str, Study_fields]:
    """
    Generates study fields from JSON file and links them to faculties.
    :param session: database session
    :param faculties: dictionary of Faculty objects mapped by faculty_short
    :param sourcefile: path to JSON file containing study field data
    :return: dictionary mapping field names to Study_fields objects
    """

    with open(sourcefile, "r", encoding="utf-8") as f:
        data = json.load(f)

    faculty_name_to_short: dict[str, str] = (
        {}
    )  # {faculty_full_name: faculty_short_name}
    for short_name, faculty_obj in faculties.items():
        faculty_name_to_short[faculty_obj.faculty_name] = short_name

    study_fields: set[tuple[str, str]] = set()  # tuple(study_field, faculty_full_name)
    for kierunek in data:
        new_el = (kierunek["nazwa"], kierunek["wydzial"])
        study_fields.add(new_el)

    db_study_fields: dict[str, Study_fields] = (
        {}
    )  # dict{study_field_name, Study_fields}

    for sf_data in study_fields:
        study_field_name, faculty_full_name = sf_data
        faculty_short = faculty_name_to_short.get(faculty_full_name)

        if not faculty_short:
            print("Wrong data - faculty not found")
            continue

        parent_faculty = faculties[faculty_short]

        sf = Study_fields(
            faculty=parent_faculty.id,
            field_name=study_field_name,
        )
        session.add(sf)
        db_study_fields[study_field_name] = sf

    session.flush()
    return db_study_fields


def _draw_pc_needed(class_type: ClassType, threshold=0.8) -> bool:
    """
    Determine whether a PC is needed for a given class type.

    This function implements a probabilistic decision model for determining PC requirements
    based on the type of class. E-learning classes always require a PC, while lectures and
    tutorials never do. For all other class types, the decision is made probabilistically
    using the specified threshold.

    :param class_type: The type of the class
    :param threshold: Probability of returning True for class types that are not explicitly handled.
    :return: True if a PC is required for the given class type, False otherwise.
    """

    if class_type in ClassType.ELEARNING:
        return True
    if class_type in [ClassType.LECTURE, ClassType.TUTORIALS]:
        return False

    return random.random() < threshold


def _draw_projector_needed(class_type: ClassType, threshold=0.8) -> bool:
    """
    Determine whether a projector is needed for a given class type.

    This function implements a probabilistic decision model for determining projector
    requirements based on the type of class. Lectures and seminars always require a projector.
    For all other class types, the decision is made probabilistically using the specified threshold.

    :param class_type: The type of the class
    :param threshold: Probability of returning True for class types that are not explicitly handled.
    :return: True if a projector is required for the given class type, False otherwise.
    """
    if class_type in [ClassType.LECTURE, ClassType.SEMINAR]:
        return True

    return random.random() < threshold


def add_course_detail(
    session: Session, course_code: int, class_type: ClassType, class_hours: int
) -> tuple[tuple[int, ClassType], Course_type_detail] | None:
    """
    Add a course detail to the database.
    If `class_hours` is less than or equal to 0, no record is created and None is returned.

    :param session: database session
    :param course_code: the code of the course to which the detail will be added
    :param class_type: the type of the class
    :param class_hours: the number of hours for this class type
    :return: the created Course_type_detail object
    """
    if class_hours <= 0:
        return None

    pc_needed = _draw_pc_needed(class_type)
    projector_needed = _draw_projector_needed(class_type)
    max_group_participants_number = 220 if class_type == ClassType.LECTURE else 15

    ctd = Course_type_detail(
        course=course_code,
        class_type=class_type,
        class_hours=class_hours,
        pc_needed=pc_needed,
        projector_needed=projector_needed,
        max_group_participants_number=max_group_participants_number,
    )

    pk: tuple[int, ClassType] = (course_code, class_type)
    db_ctd: tuple[tuple[int, ClassType], Course_type_detail] = (pk, ctd)

    session.add(ctd)
    session.flush()
    return db_ctd
