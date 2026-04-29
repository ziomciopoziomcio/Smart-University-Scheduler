import json
import random
import re
from collections import defaultdict
from typing import DefaultDict

from sqlalchemy.orm import Session

from backend.src.courses.models import (
    Major,
    Course,
    Study_program,
    Curriculum_course,
    Elective_block,
)


def _get_study_field_major_degree_from_file(
    sourcefile: str, with_major=True
) -> list[tuple[str, int, str | None]]:
    """
    Load study program data from a JSON file.

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
    Load study field data from a JSON file.
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


def _is_elective(text: str) -> bool:
    text = text.lower()
    return "obieralne" in text or "elective" in text


def _is_valid_course(course: dict) -> bool:
    name = course["Nazwa przedmiotu w języku polskim"].lower()
    code = str(course["Kod przedmiotu"]).lower()

    return not (
        _is_elective(name)
        or _is_elective(code)
        or "obieralny" in name
        or "obieralne" in name
        or "elective" in name
    )


def _is_valid_semester(semester: dict) -> bool:
    return not _is_elective(semester["nazwa"])


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

        for semester in study_field.get("semestry", []):
            if not _is_valid_semester(semester):
                continue

            sem_name = semester["nazwa"]
            # print(sem_name)

            for course in semester.get("przedmioty", []):
                if not _is_valid_course(course):
                    continue

                course_name = course["Nazwa przedmiotu w języku polskim"]
                course_code = course["Kod przedmiotu"]
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
    sem_dict = defaultdict(list)
    if not courses_dict:
        return sem_dict
    sets = [set(courses.keys()) for courses in courses_dict.values()]
    common_courses = set.intersection(*sets)
    first_major = next(iter(courses_dict))

    for course in common_courses:
        sem = courses_dict[first_major][course]
        sem_dict[sem].append(course)

    return sem_dict


def _get_courses_unique_at_the_major_level(
    courses_dict: dict[str, dict[tuple[str, str], str]],
) -> dict[str, DefaultDict[str, list[tuple[str, str]]]]:
    result: dict[str, DefaultDict[str, list[tuple[str, str]]]] = {}
    if not courses_dict:
        return result

    sets = [set(courses.keys()) for courses in courses_dict.values()]
    common_courses = set.intersection(*sets)

    used_course_codes: set[str] = set()

    for major, courses in courses_dict.items():
        semester_dict = defaultdict(list)

        for (course_name, course_code), semester in courses.items():
            if (course_name, course_code) in common_courses:
                continue

            if course_code in used_course_codes:
                continue

            semester_dict[semester].append((course_name, course_code))
            used_course_codes.add(course_code)

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


def _get_major_id(
    major_name: str | None,
    db_majors: dict[tuple[str, str], Major],
    study_field_name: str,
) -> tuple[int | None, str | None]:
    if major_name is None:
        major_obj = None
    else:
        major_obj = db_majors.get((study_field_name, major_name), None)
        if major_obj is None:
            print(f"Cannot find major with name {major_name}")
            return None, "error"
    major_id = major_obj.id if major_obj else None
    return major_id, None


def _get_course_obj(
    course_code: str | None, db_courses: dict[int, Course]
) -> tuple[Course | None, int]:
    if course_code is None:
        print("Cannot add course - no course code provided")
        return None, 0

    course_code_int = _parse_course_code(course_code)
    course_obj = db_courses.get(course_code_int, None)
    if course_obj is None:
        print(f"Cannot find course with code {course_code_int}")
        return None, 0
    return course_obj, course_code_int


def _get_study_programs_objs(
    db_study_programs: dict[tuple[str, str, int], Study_program],
    study_field_name: str,
    study_degree: int,
) -> list[Study_program] | None:
    study_programs_obj: list[Study_program] = []
    for key in db_study_programs.keys():
        if key[0] == study_field_name and key[2] == study_degree:
            study_programs_obj.append(db_study_programs[key])
    if len(study_programs_obj) == 0:
        print(
            f"Cannot find any study program for field {study_field_name} and degree {study_degree}"
        )
        return None
    return study_programs_obj


def _create_curriculum_courses(
    study_programs_obj: list[Study_program],
    course_code_int: int,
    semester_id: int,
    major_id: int | None,
    major_name: str | None,
    session: Session,
) -> dict[tuple[str | None, int, int, str | None, str | None], Curriculum_course]:
    added: dict[
        tuple[str | None, int, int, str | None, str | None], Curriculum_course
    ] = {}
    check_added: list[tuple] = []
    for sp_obj in study_programs_obj:
        sp_id = sp_obj.id

        # check
        wrong = False
        for el in check_added:
            if el[0] == sp_id and el[1] == course_code_int and el[2] == semester_id:
                wrong = True
                break
        if wrong:
            continue

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
        check_added.append((sp_id, course_code_int, semester_id))

    return added


def _add_curriculum_course(
    course_code: str | None,
    major_name: str | None,
    study_field_name: str,
    study_degree: int,
    semester_id: int,
    db_objects: tuple,
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
    :param db_objects: tuple containing:
     -db_study_programs: dictionary mapping (study_field_name, start_year, degree)
        to Study_program generated by generate_study_programs function
     -db_courses: dictionary mapping course codes to Course objects
        generated by generate_courses function
     -db_majors: dictionary mapping (study_field_name, major_name) tuples
        to their corresponding Major objects generated by generate_majors function
    :param session: database session
    :return: dictionary mapping (program_name, course_code, semester_id, major_name, elective_block_name)
        to Curriculum_course object
    """
    db_study_programs, db_courses, db_majors = db_objects

    # study program objs
    study_programs_obj: list[Study_program] | None = _get_study_programs_objs(
        db_study_programs, study_field_name, study_degree
    )
    if study_programs_obj is None:
        return None

    # course obj
    course_obj, course_code_int = _get_course_obj(course_code, db_courses)
    if course_obj is None:
        return None

    # major
    major_id, err = _get_major_id(major_name, db_majors, study_field_name)
    if err is not None:
        return None

    # add to db
    added: dict[
        tuple[str | None, int, int, str | None, str | None], Curriculum_course
    ] = _create_curriculum_courses(
        study_programs_obj, course_code_int, semester_id, major_id, major_name, session
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


def _add_unique_to_db(
    unique,
    study_field_name,
    study_degree,
    db_study_programs,
    db_courses,
    db_majors,
    session,
    db_curr_courses,
):
    for major, major_dict in sorted(unique.items()):
        print(f"{major}:")
        for semester, courses in sorted(major_dict.items()):
            print(f"{semester}:")
            semester_id = _get_semester_number(semester)

            if semester_id is None:
                continue
            for course in courses:
                print(f"  - {course} ({major})")
                # course_name = course[0]
                course_code = course[1]
                # add to db
                added = _add_curriculum_course(
                    course_code=course_code,
                    major_name=major,
                    study_field_name=study_field_name,
                    study_degree=study_degree,
                    semester_id=semester_id,
                    db_objects=(db_study_programs, db_courses, db_majors),
                    session=session,
                )
                if added:
                    db_curr_courses.update(added)


def _add_common_to_db(
    common,
    study_field_name,
    study_degree,
    db_study_programs,
    db_courses,
    db_majors,
    session,
    db_curr_courses,
):
    for semester, courses in sorted(common.items()):
        print(f"{semester}:")
        semester_id = _get_semester_number(semester)
        if semester_id is None:
            continue

        for course in courses:
            print(f"  - {course}")
            # course_name = course[0]
            course_code = course[1]
            # add to db
            added = _add_curriculum_course(
                course_code=course_code,
                major_name=None,
                study_field_name=study_field_name,
                study_degree=study_degree,
                semester_id=semester_id,
                db_objects=(db_study_programs, db_courses, db_majors),
                session=session,
            )
            if added:
                db_curr_courses.update(added)


def _add_common_and_unique_to_db(
    cu,
    study_field_name,
    study_degree,
    db_study_programs,
    db_courses,
    db_majors,
    session,
    db_curr_courses,
):

    common, unique = cu

    _add_common_to_db(
        common,
        study_field_name,
        study_degree,
        db_study_programs,
        db_courses,
        db_majors,
        session,
        db_curr_courses,
    )

    _add_unique_to_db(
        unique,
        study_field_name,
        study_degree,
        db_study_programs,
        db_courses,
        db_majors,
        session,
        db_curr_courses,
    )


def _get_common_and_unique(study_fields):
    courses_dict = _prepare_courses_dict(study_fields)
    common = _get_courses_common_for_all_majors(courses_dict)
    unique = _get_courses_unique_at_the_major_level(courses_dict)
    return common, unique


def generate_curriculum_courses(
    sourcefile: str,
    session: Session,
    db_study_programs: dict[tuple[str, str, int], Study_program],
    db_courses: dict[int, Course],
    db_majors: dict[tuple[str, str], Major],
) -> dict[tuple[str | None, int, int, str | None, str | None], Curriculum_course]:
    """
    Generate curriculum courses.
    :param sourcefile: path to JSON file containing study field data
    :param session: database session
    :param db_study_programs: dictionary mapping (study_field_name, start_year, degree)
        to Study_program generated by generate_study_programs function
    :param db_courses: dictionary mapping course codes to Course objects
        generated by generate_courses function
    :param db_majors: dictionary mapping (study_field_name, major_name) tuples
        to their corresponding Major objects generated by generate_majors function
    :return:  Dictionary mapping:
    (program_name, course_code, semester_id, major_name, elective_block_name)
    to Curriculum_course objects.
    """
    db_curr_courses: dict[
        tuple[str | None, int, int, str | None, str | None], Curriculum_course
    ] = {}

    combs = _get_study_field_major_degree_from_file(sourcefile, with_major=False)

    for study_field_name, study_degree, _ in combs:

        # if study_field_name != "informatyka." or study_degree != 1:
        #     continue

        print(
            f" PROCESSING: {study_field_name}, degree {study_degree}. ======================================================================"
        )

        study_fields = _get_unique_study_fields(
            sourcefile, study_field_name, study_degree
        )

        common, unique = _get_common_and_unique(study_fields)

        # _display_courses_common_for_all_majors(common)
        # _display_courses_unique_at_the_major_level(unique)

        _add_common_and_unique_to_db(
            (common, unique),
            study_field_name,
            study_degree,
            db_study_programs,
            db_courses,
            db_majors,
            session,
            db_curr_courses,
        )

    session.flush()
    return db_curr_courses


def generate_curriculum_courses_elective_blocks(
    sourcefile: str,
    session: Session,
    db_study_programs: dict[tuple[str, str, int], Study_program],
    db_courses: dict[int, Course],
    db_elective_blocks: dict[tuple[str, str], Elective_block],
    limit: int,
    seed: int | None = None,
) -> dict[tuple[str | None, int, int, str | None, str | None], Curriculum_course]:
    """
    Generate curriculum courses (elective blocks).
    :param sourcefile: path to JSON file containing study field data
    :param session: database session
    :param db_study_programs: dictionary mapping (study_field_name, start_year, degree)
        to Study_program generated by generate_study_programs function
    :param db_courses: dictionary mapping course codes to Course objects
        generated by generate_courses function
    :param db_elective_blocks: dictionary mapping elective blocks and study field names
        to their corresponding Elective_block objects generated by generate_elective_blocks function
    :param limit: limit elective courses per study program
    :param seed: seed
    :return: Dictionary mapping:
    (program_name, course_code, semester_id, major_name, elective_block_name)
    to Curriculum_course objects.
    """

    if seed is not None:
        random.seed(seed)

    db_curr_courses: dict[
        tuple[str | None, int, int, str | None, str | None], Curriculum_course
    ] = {}

    with open(sourcefile, "r", encoding="utf-8") as f:
        data = json.load(f)

    unique_programs = []
    added_check = []
    limit_control = {}

    for study_field in data:
        study_field_name = study_field.get("nazwa", None)
        degree = study_field.get("stopien", None)
        if (study_field_name, degree) in unique_programs:
            continue
        unique_programs.append((study_field_name, degree))
        print(
            f"{study_field_name}, degree {degree} ======================================="
        )

        # find study programs
        study_programs = set()
        sp_keys = db_study_programs.keys()
        for k in sp_keys:
            if k[0] == study_field_name and k[2] == degree:
                study_programs.add(k)

        for semester in study_field.get("semestry", []):
            if "obieralne" in semester["nazwa"]:
                for przedmiot in semester.get("przedmioty", []):
                    print(
                        przedmiot["Nazwa przedmiotu w języku polskim"],
                        przedmiot["Kod przedmiotu"],
                    )

                    # get course
                    course_code = _parse_course_code(przedmiot["Kod przedmiotu"])
                    course_obj = db_courses.get(course_code, None)
                    if course_obj is None:
                        print(f"Cannot find course with code {course_code}")
                        continue

                    # random elective block for study field
                    to_choose = set()
                    eb_keys = db_elective_blocks.keys()
                    for k in eb_keys:
                        if k[1] == study_field_name:
                            to_choose.add(k)
                    chosen_eb = db_elective_blocks[random.choice(list(to_choose))]

                    if degree == 1:
                        semester = 6
                    else:
                        semester = random.choice([1, 2, 3])

                    for sp in study_programs:
                        sp_id = db_study_programs[sp].id
                        sp_name = db_study_programs[sp].program_name

                        # added check
                        to_add = (sp_id, course_code, semester)
                        if to_add in added_check:
                            continue
                        added_check.append(to_add)

                        # limit control
                        if (sp_id, chosen_eb.id) in limit_control.keys():
                            if limit_control[(sp_id, chosen_eb.id)] >= limit:
                                continue

                        # everything is ok - add to db
                        cc_obj = Curriculum_course(
                            study_program=sp_id,
                            course=course_code,
                            semester=semester,
                            elective_block=chosen_eb.id,
                        )
                        session.add(cc_obj)
                        db_curr_courses[
                            (
                                sp_name,
                                course_code,
                                semester,
                                None,
                                chosen_eb.elective_block_name,
                            )
                        ] = cc_obj

                        # update checks
                        if (sp_id, chosen_eb.id) not in limit_control.keys():
                            limit_control[(sp_id, chosen_eb.id)] = 1
                        else:
                            limit_control[(sp_id, chosen_eb.id)] = (
                                1 + limit_control[(sp_id, chosen_eb.id)]
                            )

    session.flush()
    return db_curr_courses
