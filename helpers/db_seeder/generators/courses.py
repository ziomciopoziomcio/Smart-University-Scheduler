import random
import re

from sqlalchemy.orm import Session
import json

from backend.src.facilities.models import Faculty
from backend.src.academics.models import Units, Employees
from backend.src.courses.models import (
    Study_fields,
    Course,
    ClassType,
    CourseLanguage,
    Course_type_detail,
    StudyMode,
    Major,
    Elective_block,
    FrequencyType,
)


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
            mode=StudyMode.FULL_TIME,
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


def _get_info_about_freq(class_hours: int):
    if class_hours <= 5:
        freq = FrequencyType.MANUAL
        weeks = [1, 2, 3]
        slots = 2
        return slots, freq, weeks

    elif class_hours <= 15:
        freq = random.choice(
            [
                FrequencyType.BIWEEKLY,
                FrequencyType.FIRST_HALF,
                FrequencyType.SECOND_HALF,
            ]
        )

        weeks = None
        slots = 2
        return slots, freq, weeks

    elif class_hours <= 30:
        freq = FrequencyType.EVERY_WEEK
        weeks = None
        slots = 2
        return slots, freq, weeks

    elif class_hours <= 60:
        freq = FrequencyType.EVERY_WEEK
        weeks = None
        slots = 4
        return slots, freq, weeks
    else:
        freq = FrequencyType.EVERY_WEEK
        weeks = None
        slots = 6
        return slots, freq, weeks


def add_course_detail(
    session: Session, course_code: int, class_type: ClassType, class_hours: int
) -> tuple[tuple[int, ClassType], Course_type_detail]:
    """
    Add a course detail to the database.
    If `class_hours` is less than or equal to 0, no record is created and None is returned.

    :param session: database session
    :param course_code: the code of the course to which the detail will be added
    :param class_type: the type of the class
    :param class_hours: the number of hours for this class type
    :return: the created Course_type_detail object
    """
    # if class_hours <= 0:
    #     return None

    pc_needed = _draw_pc_needed(class_type)
    projector_needed = _draw_projector_needed(class_type)
    max_group_participants_number = 220 if class_type == ClassType.LECTURE else 15
    slots, freq, weeks = _get_info_about_freq(class_hours)

    ctd = Course_type_detail(
        course=course_code,
        class_type=class_type,
        class_hours=class_hours,
        slots_per_class=slots,
        frequency=freq,
        manual_weeks=weeks,
        pc_needed=pc_needed,
        projector_needed=projector_needed,
        max_group_participants_number=max_group_participants_number,
    )

    pk: tuple[int, ClassType] = (course_code, class_type)
    db_ctd: tuple[tuple[int, ClassType], Course_type_detail] = (pk, ctd)

    session.add(ctd)
    session.flush()
    return db_ctd


def _parse_hours_to_int(hours: str) -> int:
    """
    Converts a value to an integer representing hours.
    :param hours: hours as string
    :return: hours as integer
    """
    try:
        result = int(hours)
    except (ValueError, TypeError):
        result = 0
    return result


def _map_units(units: dict[str, Units]):
    """
    Creates a mapping from unit full names to their IDs.
    :param units: dictionary where keys are unit short names and values are Units objects.
    :return: dictionary where keys are unit full names and values are their IDs.
    """
    result = {}
    for unit in units.values():
        result[unit.unit_name] = unit.id
    return result


def _parse_course_code(course_code: str) -> int:
    """
    Extracts digits from a course code string and converts them to an integer.
    :param course_code: String containing a course code.
    :return: Course code as an integer.
    """

    digits = re.sub(r"\D", "", course_code)
    return int(digits) if digits else 0


def _parse_course_language(
    language: str, default=CourseLanguage.POLISH
) -> CourseLanguage:
    """
    Parses a course language from a string and returns the corresponding CourseLanguage enum value.
    :param language: String containing a course language.
    :param default: Default course language.
    :return: Course language enum value.
    """
    language_lower = language.lower()
    if language_lower == "polski":
        return CourseLanguage.POLISH
    elif language_lower == "angielski":
        return CourseLanguage.ENGLISH
    elif language_lower == "francuski":
        return CourseLanguage.FRENCH
    else:
        return default


def generate_courses(
    session: Session,
    units: dict[str, Units],
    db_employees: dict[tuple[str | None, str, str], Employees],
    sourcefile="../../../helpers/data_collector/final-programy.json",
) -> dict[int, Course]:
    """
    Generates courses from JSON file and links them to units.
    :param session: database session
    :param units: dictionary of Units objects mapped by unit_short
    :param db_employees: dictionary of employees
    :param sourcefile: path to JSON file containing study field data
    :return: dictionary mapping course codes to Course objects
    """

    with open(sourcefile, "r", encoding="utf-8") as f:
        data = json.load(f)

    mapped_units = _map_units(units)

    db_courses: dict[int, Course] = {}  # already added

    for kierunek in data:
        for semestr in kierunek["semestry"]:
            for przedmiot in semestr["przedmioty"]:
                try:
                    course_code = _parse_course_code(przedmiot["Kod przedmiotu"])
                    ects = int(przedmiot["ECTS"])
                    course_name = przedmiot["Nazwa przedmiotu w języku polskim"]
                    course_language = _parse_course_language(przedmiot["jezyk"])
                    leading_unit = przedmiot["jednostka"]
                    course_coordinator = przedmiot["kierownik"]

                    print(
                        f"Processing course: {course_code} {ects} - {course_name} -  - {leading_unit} - {course_coordinator}"
                    )

                    # validation
                    if course_code == 0:
                        print(
                            f"Wrong data - could not parse course code - {course_name}"
                        )
                        continue

                    if course_coordinator == "":
                        print(f"Wrong data - no course coordinator - {course_name}")
                        continue

                    if course_code in db_courses.keys():
                        print(f"Duplicate course code {course_code}: {course_name}")
                        continue

                    leading_unit_id = mapped_units.get(leading_unit, None)
                    if leading_unit_id is None:
                        print("Wrong data - leading unit not found")
                        continue

                    # course_coordinator mapping
                    course_coordinator_id = -1
                    emp_keys = list(db_employees.keys())
                    for k in emp_keys:
                        # degree = k[0]
                        name = k[1]
                        surname = k[2]
                        # if degree is not None:
                        #     if (
                        #         degree in course_coordinator
                        #         and name in course_coordinator
                        #         and surname in course_coordinator
                        #     ):
                        #         course_coordinator_id = db_employees[k].id
                        #         break
                        # else:
                        if name in course_coordinator and surname in course_coordinator:
                            course_coordinator_id = db_employees[k].id
                            break
                    if course_coordinator_id == -1:
                        print("Wrong data - no course coordinator found")
                        continue

                    # add course
                    course = Course(
                        course_code=course_code,
                        ects_points=ects,
                        course_name=course_name,
                        course_language=course_language,
                        leading_unit=leading_unit_id,
                        course_coordinator=course_coordinator_id,
                    )
                    session.add(course)
                    db_courses[course_code] = course

                except KeyError as e:
                    print(
                        f"Could not find key in course - {e} - {przedmiot['Nazwa przedmiotu w języku polskim']}"
                    )
                    continue

    session.flush()
    return db_courses


def generate_course_type_details(
    session: Session,
    courses: dict[int, Course],
    sourcefile="../../../helpers/data_collector/final-programy.json",
) -> dict[tuple[int, ClassType], Course_type_detail]:
    """
    Generates course type details from JSON file.
    :param session: database session
    :param courses: dictionary mapping course codes (int) to Course objects.
    :param sourcefile: path to JSON file containing study field data
    :return: dictionary mapping (course_code, ClassType) tuples to their corresponding
         Course_type_detail objects.
    """

    with open(sourcefile, "r", encoding="utf-8") as f:
        data = json.load(f)

    course_codes_db = courses.keys()  # only course codes
    db_course_type_details: dict[tuple[int, ClassType], Course_type_detail] = {}
    already_added_codes: set[int] = set()  # helper

    for kierunek in data:
        for semestr in kierunek["semestry"]:
            for przedmiot in semestr["przedmioty"]:
                try:
                    course_code = _parse_course_code(przedmiot["Kod przedmiotu"])
                    course_name = przedmiot["Nazwa przedmiotu w języku polskim"]

                    if course_code not in course_codes_db:
                        print(f"Course code {course_code} not found")
                        continue

                    if course_code in already_added_codes:
                        print(f"Course code {course_code} type details already added")
                        continue

                    lecture_hours = _parse_hours_to_int(przedmiot["W"])
                    tutorials_hours = _parse_hours_to_int(przedmiot["Ć"])
                    labs_hours = _parse_hours_to_int(przedmiot["L"])
                    seminar_hours = _parse_hours_to_int(przedmiot["S"])
                    other_hours = _parse_hours_to_int(przedmiot["I"])
                    elearning_hours = _parse_hours_to_int(przedmiot["E-Learn."])

                    _course_coordinator = przedmiot[
                        "kierownik"
                    ]  # only for validating course

                    print(
                        f"{course_code} {course_name}: {lecture_hours}, {tutorials_hours}, {labs_hours}, {seminar_hours}, {other_hours}, {elearning_hours}"
                    )

                    # correct data - adding do db

                    mapped = {
                        ClassType.LECTURE: lecture_hours,
                        ClassType.TUTORIALS: tutorials_hours,
                        ClassType.LABORATORY: labs_hours,
                        ClassType.SEMINAR: seminar_hours,
                        ClassType.OTHER: other_hours,
                        ClassType.ELEARNING: elearning_hours,
                    }

                    for class_type in mapped.keys():
                        hours = mapped[class_type]
                        if hours > 0:
                            added: tuple[tuple[int, ClassType], Course_type_detail] = (
                                add_course_detail(
                                    session, course_code, class_type, hours
                                )
                            )

                            db_course_type_details[added[0]] = added[1]
                    already_added_codes.add(course_code)

                except KeyError as e:
                    print(
                        f"Could not find key in course - {e} - {przedmiot['Nazwa przedmiotu w języku polskim']}"
                    )
                    continue

    session.flush()
    return db_course_type_details


def _extract_majors_from_file(sourcefile) -> list[tuple[str, str]]:
    """
    Extracts unique (study_field_name, major_name) pairs from a JSON file.
    :param sourcefile: path to JSON file containing study field data
    :return: list of unique (study_field_name, major_name) pairs sorted by study_field_name
    """
    with open(sourcefile, "r", encoding="utf-8") as f:
        data = json.load(f)

    majors = set()
    for kierunek in data:
        if kierunek["specjalizacja"] is not None:
            new_major = (kierunek["nazwa"], kierunek["specjalizacja"])
            majors.add(new_major)

    majors = list(majors)
    majors.sort(key=lambda x: x[0])
    return majors


def generate_majors(
    session: Session,
    study_fields: dict[str, Study_fields],
    sourcefile="../../../helpers/data_collector/final-programy.json",
) -> dict[tuple[str, str], Major]:
    """
    Creates Major objects based on data extracted from a JSON file.
    :param session: database session
    :param study_fields: dictionary mapping study fields names
        to their corresponding Study_fields objects.
    :param sourcefile: path to JSON file containing study field data
    :return: dictionary mapping (study_field_name, major_name) tuples
        to their corresponding Major objects.
    """

    db_majors: dict[tuple[str, str], Major] = {}
    majors = _extract_majors_from_file(sourcefile)

    for study_field_name, major_name in majors:
        try:
            study_field_obj: Study_fields = study_fields[study_field_name]
        except KeyError as e:
            print(
                f"Could not find study field for major - {e} - {study_field_name} - {major_name}"
            )
            continue
        study_field_id: int = study_field_obj.id

        major = Major(study_field=study_field_id, major_name=major_name)
        session.add(major)
        db_majors[(study_field_name, major_name)] = major

    session.flush()
    return db_majors


def generate_elective_blocks(
    session: Session,
    study_fields: dict[str, Study_fields],
) -> dict[tuple[str, str], Elective_block]:
    """
    Creates Elective_block objects
    :param session: database session
    :param study_fields: dictionary mapping study fields names
        to their corresponding Study_fields objects.
    :return: dictionary mapping elective blocks and study field names
        to their corresponding Elective_block objects.
    """

    db_elective_blocks: dict[tuple[str, str], Elective_block] = (
        {}
    )  # elective_block_name, study_field_name, object

    elective_blocks_names = {
        "informatyka.": [
            "Programowanie Gier",
            "Technologie mobilne",
            "Big Data i programowanie aplikacji bazodanowych",
            "Zaawansowane aplikacje bazodanowe",
            "Testowanie i zapewnianie jakości oprogramowania",
            "Zarządzanie sieciami komputerowymi",
        ],
        "elektronika i telekomunikacja": [
            "Digital Signal Processing",
            "Wireless Communication Systems",
            "Embedded Systems Design",
            "Optical Fiber Networks",
            "Radio Communication Systems",
            "Microelectronics Basics",
        ],
        "automatyka i sterowanie robotów": [
            "Advanced Control Systems",
            "Industrial Robotics",
            "Autonomous Systems",
            "Sensor Networks",
            "PLC Programming",
            "Machine Vision Systems",
        ],
        "elektrotechnika": [
            "Power Systems Engineering",
            "Electrical Machines",
            "High Voltage Engineering",
            "Renewable Energy Systems",
            "Electrical Installations",
            "Smart Grids",
        ],
        "computer science and information technology": [
            "Cloud Computing",
            "Big Data Systems",
            "Cybersecurity",
            "Software Engineering",
            "Mobile Applications",
            "Computer Networks",
        ],
        "biomedical engineering and technologies": [
            "Medical Imaging",
            "Biomedical Signal Processing",
            "Biosensors",
            "Rehabilitation Engineering",
            "Healthcare IT Systems",
            "Biomechanics",
        ],
        "computer science": [
            "Algorithms and Data Structures II",
            "Machine Learning Fundamentals",
            "Distributed Systems",
            "Web Application Development",
            "Cybersecurity Basics",
        ],
    }

    for sf_name in elective_blocks_names.keys():
        print(f"STUDY FIELD: {sf_name} ==============================")
        sf_obj = study_fields.get(sf_name, None)

        if sf_obj is None:
            print("STUDY FIELD NOT FOUND")
            continue

        sf_id: int = sf_obj.id

        for eb_name in elective_blocks_names[sf_name]:
            eb_obj = Elective_block(study_field=sf_id, elective_block_name=eb_name)
            db_elective_blocks[(eb_name, sf_name)] = eb_obj
            session.add(eb_obj)
            print(f"Added {eb_name}")

        print()
        print()
        print()

    session.flush()
    return db_elective_blocks
