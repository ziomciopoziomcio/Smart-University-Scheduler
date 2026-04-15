import json
import re
from collections import defaultdict
from typing import DefaultDict

from sqlalchemy.orm import Session
from src.courses.models import Major, Course, Study_program, Curriculum_course


def _get_study_field_major_degree_from_file(
    sourcefile: str, with_major=True
) -> list[tuple[str, int, str | None]]:
    """
    Load study program data from a JSON file and return unique combinations
    of (study field name, degree, major).
    :param sourcefile: path to JSON file containing study field data
    :param with_major: if True, includes major in the result.
            If False, major is set to None for all entries.
            Defaults to True.
    :return: a sorted list of unique tuples in the form:
            (study field name, degree, major)
    """
    with open(sourcefile, "r", encoding="utf-8") as f:
        data = json.load(f)

    unique_combinations: set[tuple[str, int, str | None]] = set()

    for study_field in data:
        study_field_name = study_field.get("nazwa", None)
        degree = study_field.get("stopien", None)
        if with_major:
            major = study_field.get("specjalizacja", None)
        else:
            major = None
        if study_field_name is None or degree is None:
            continue

        unique_combinations.add((study_field_name, int(degree), major))
    return sorted(list(unique_combinations))


def _get_unique_study_fields(
    sourcefile: str, study_field_name: str, degree: int
) -> list:
    """
    Load study field data from a JSON file and return unique combinations
    :param sourcefile: path to JSON file containing study field data
    :param study_field_name: name of the study field to filter
    :param degree: degree to filter
    :return: a list of unique study fields records (dictionaries) that match
            the given program name and degree.
    """
    with open(sourcefile, "r", encoding="utf-8") as f:
        data = json.load(f)

    added: set[tuple[str, int, str]] = set()
    records: list = []

    for study_field in data:
        name = study_field.get("nazwa", None)
        deg = study_field.get("stopien", None)
        major = study_field.get("specjalizacja", None)
        if name is None or deg is None:
            continue

        if name == study_field_name and deg == degree:
            if (name, deg, major) not in added:
                records.append(study_field)
                added.add((name, deg, major))

    return records


def _prepare_courses_dict(study_fields: list) -> dict[str, dict[tuple[str, str], str]]:
    """
    Build a nested dictionary of courses grouped by specialization (major).
    :param study_fields: a list of study field records (dictionaries) containing course information.
    :return: a dictionary structured as:
            {
                major: {
                    (course_name, course_code): semester_name
                }
            }
    """
    courses_dict: dict[str, dict[tuple[str, str], str]] = {}
    # dict[major, dict[tuple[course_name, course_code], semester]]

    for study_field in study_fields:
        major = study_field["specjalizacja"]

        if major not in courses_dict:
            courses_dict[major] = {}

        for semester in study_field["semestry"]:
            if (
                "obieralne" in semester["nazwa"].lower()
                or "elective" in semester["nazwa"].lower()
            ):
                continue

            sem_name = semester["nazwa"]
            # print(sem_name)

            for course in semester["przedmioty"]:
                course_name = course["Nazwa przedmiotu w języku polskim"]
                course_code = course["Kod przedmiotu"]

                if (
                    "obieralne" in course_name.lower()
                    or "elective" in course_name.lower()
                ):
                    continue

                # print(nazwa_przedmiotu)

                # add to dict
                courses_dict[major][(course_name, course_code)] = sem_name
    return courses_dict


def _get_courses_common_for_all_majors(
    courses_dict: dict[str, dict[tuple[str, str], str]],
) -> DefaultDict[str, list[tuple[str, str]]]:
    """
    Find courses that are common across all majors and group them by semester.
    :param courses_dict: a dictionary where:
            - key: major (specialization)
            - value: dictionary mapping (course_name, course_code) -> semester_name
    :return: a dictionary mapping semester names to lists of courses that are
            present in all majors
    """
    sets = [set(courses.keys()) for courses in courses_dict.values()]
    common_courses = set.intersection(*sets)

    first_major = next(iter(courses_dict))
    sem_dict = defaultdict(list)

    for course in common_courses:
        sem = courses_dict[first_major][course]
        sem_dict[sem].append(course)

    return sem_dict


def _get_courses_unique_at_the_major_level(
    courses_dict: dict[str, dict[tuple[str, str], str]],
) -> dict[str, DefaultDict[str, list[tuple[str, str]]]]:
    """
    Extract courses that are unique to each major and group them by semester.
    :param courses_dict: a dictionary where:
            - key: major (specialization)
            - value: dictionary mapping (course_name, course_code) -> semester_name
    :return: a dictionary where:
            - key: major
            - value: dictionary mapping semester names to lists of unique courses
    """
    result: dict[str, DefaultDict[str, list[tuple[str, str]]]] = {}
    sets = [set(courses.keys()) for courses in courses_dict.values()]
    common_courses = set.intersection(*sets)

    for major, courses in courses_dict.items():
        # print(f"MAJOR: {major}")

        semester_dict = defaultdict(list)

        for course, semester in courses.items():
            if course not in common_courses:
                semester_dict[semester].append(course)

        result[major] = semester_dict

    return result


def _display_courses_common_for_all_majors(
    sem_dict: DefaultDict[str, list[tuple[str, str]]],
) -> None:
    """
    Print courses that are common across all majors, grouped by semester.
    :param sem_dict: a dictionary mapping semester names to lists of courses.
    :return: None
    """
    print("Courses common for all majors:")

    for sem in sorted(sem_dict.keys()):
        print(f"{sem}:")
        for p in sem_dict[sem]:
            course_name = p[0]
            course_code = p[1]
            print(f"  - {course_name} ({course_code})")

    print()
    print()


def _display_courses_unique_at_the_major_level(
    unique: dict[str, DefaultDict[str, list[tuple[str, str]]]],
) -> None:
    """
    Print courses that are unique to each major, grouped by semester.
    :param unique: a dictionary where:
            - key: major (specialization)
            - value: dictionary mapping semester names to lists of courses
    :return: None
    """
    print("Courses from major:")
    for major, sem_dict in sorted(unique.items()):
        print(f"MAJOR: {major}")

        for semester, course_clist in sem_dict.items():
            print(f"  {semester}:")
            for p in course_clist:
                course_name = p[0]
                course_code = p[1]
                print(f"  - {course_name} ({course_code})")
        print()
    print()
    print()


def _parse_course_code(course_code: str) -> int:
    """
    Extracts digits from a course code string and converts them to an integer.
    :param course_code: String containing a course code.
    :return: Course code as an integer.
    """

    digits = re.sub(r"\D", "", course_code)
    return int(digits) if digits else 0


def _add_curriculum_course(
    course_code: str | None,
    major_name: str | None,
    study_field_name: str,
    study_degree: int,
    semester_id: int,
    db_study_programs: dict[tuple[str, str, int], Study_program],
    db_courses: dict[int, Course],
    db_majors: dict[tuple[str, str], Major],
    session: Session,
) -> (
    dict[tuple[str | None, int, int, str | None, str | None], Curriculum_course] | None
):
    """
    Adds curriculum course entries for all matching study programs.
    :param course_code: course code as str
    :param major_name: major name
    :param study_field_name: study field name
    :param study_degree: study degree as int
    :param semester_id: semester id as int
    :param db_study_programs: dictionary mapping (study_field_name, start_year)
        to Study_program generated by generate_study_programs function
    :param db_courses: dictionary mapping course codes to Course objects
        generated by generate_courses function
    :param db_majors: dictionary mapping (study_field_name, major_name) tuples
        to their corresponding Major objects generated by generate_majors function
    :param session: database session
    :return: dictionary mapping (program_name, course_code, semester_id, major_name, elective_block_name)
        to Curriculum_course object
    """
    # study program objs
    study_programs_obj: list[Study_program] = []
    for key in db_study_programs.keys():
        if key[0] == study_field_name and key[2] == study_degree:
            study_programs_obj.append(db_study_programs[key])
    if len(study_programs_obj) == 0:
        print(
            f"Cannot find any study program for field {study_field_name} and degree {study_degree}"
        )
        return None

    # course obj
    if course_code is None:
        print("Cannot add course - no course code provided")
        return None

    course_code_int = _parse_course_code(course_code)
    course_obj = db_courses.get(course_code_int, None)
    if course_obj is None:
        print(f"Cannot find course with code {course_code_int}")
        return None

    # major
    if major_name is None:
        major_obj = None
    else:
        major_obj = db_majors.get((study_field_name, major_name), None)
        if major_obj is None:
            print(f"Cannot find major with name {major_name}")
            return None
    major_id = major_obj.id if major_obj else None

    # add to db
    added: dict[
        tuple[str | None, int, int, str | None, str | None], Curriculum_course
    ] = {}
    for sp_obj in study_programs_obj:
        sp_id = sp_obj.id
        cc_obj = Curriculum_course(
            study_program=sp_id,
            course=course_code_int,
            semester=semester_id,
            major=major_id,
        )
        session.add(cc_obj)
        added[(sp_obj.program_name, course_code_int, semester_id, major_name, None)] = (
            cc_obj
        )
    return added


def _get_semester_number(text: str) -> int | None:
    """
    Get semester number from text.
    :param text: text representing semester name
    :return: semester number
    """
    match = re.search(r"\d+", text)
    return int(match.group()) if match else None


def generate_curriculum_courses(
    sourcefile: str,
    session: Session,
    db_study_programs: dict[tuple[str, str, int], Study_program],
    db_courses: dict[int, Course],
    db_majors: dict[tuple[str, str], Major],
):
    """
    Generate curriculum courses
    :param sourcefile: path to JSON file containing study field data
    :param session: database session
    :param db_study_programs: dictionary mapping (study_field_name, start_year)
        to Study_program generated by generate_study_programs function
    :param db_courses: dictionary mapping course codes to Course objects
        generated by generate_courses function
    :param db_majors: dictionary mapping (study_field_name, major_name) tuples
        to their corresponding Major objects generated by generate_majors function
    :return:  Dictionary mapping:
    (program_name, course_code, semester_id, major_name, elective_block_name)
    to Curriculum_course objects.
    """
    db_curr_courses: major_dict[
        tuple[str | None, int, int, str | None, str | None], Curriculum_course
    ] = {}

    combs = _get_study_field_major_degree_from_file(sourcefile, with_major=False)

    for comb in combs:
        study_field_name = comb[0]
        study_degree = comb[1]

        # if study_field_name != "informatyka." or study_degree != 1:
        #     continue

        print(
            f" PROCESSING: {study_field_name}, degree {study_degree}. ======================================================================"
        )

        study_fields = _get_unique_study_fields(
            sourcefile, study_field_name, study_degree
        )

        courses_dict = _prepare_courses_dict(study_fields)
        common = _get_courses_common_for_all_majors(courses_dict)
        unique = _get_courses_unique_at_the_major_level(courses_dict)

        # _display_courses_common_for_all_majors(common)
        # _display_courses_unique_at_the_major_level(unique)

        # common
        for semester, courses in sorted(common.items()):
            print(f"{semester}:")
            semester_id = _get_semester_number(semester)
            if semester_id is None:
                continue

            for course in courses:
                print(f"  - {course}")
                # course_name = course[1]
                course_code = course[0]
                # add to db
                added = _add_curriculum_course(
                    course_code=course_code,
                    major_name=None,
                    study_field_name=study_field_name,
                    study_degree=study_degree,
                    semester_id=semester_id,
                    db_study_programs=db_study_programs,
                    db_courses=db_courses,
                    db_majors=db_majors,
                    session=session,
                )
                if added:
                    db_curr_courses.update(added)

        # unique
        for major, major_dict in sorted(unique.items()):
            print(f"{major}:")
            for semester, courses in sorted(major_dict.items()):
                print(f"{semester}:")
                semester_id = _get_semester_number(semester)

                if semester_id is None:
                    continue
                for course in courses:
                    print(f"  - {course} ({major})")
                    # course_name = course[1]
                    course_code = course[0]
                    # add to db
                    added = _add_curriculum_course(
                        course_code=course_code,
                        major_name=major,
                        study_field_name=study_field_name,
                        study_degree=study_degree,
                        semester_id=semester_id,
                        db_study_programs=db_study_programs,
                        db_courses=db_courses,
                        db_majors=db_majors,
                        session=session,
                    )
                    if added:
                        db_curr_courses.update(added)

    session.flush()
    return db_curr_courses
