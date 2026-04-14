import json
from collections import defaultdict
from typing import DefaultDict


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
            if "obieralne" in semester["nazwa"]:  # todo be aware of english names
                continue

            sem_name = semester["nazwa"]
            # print(sem_name)

            for course in semester["przedmioty"]:
                course_name = course["Nazwa przedmiotu w języku polskim"]
                course_code = course["Kod przedmiotu"]

                if "obieralne" in course_name:  # todo be aware of english names
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


if __name__ == "__main__":
    path = "../../data_collector/final-programy.json"

    combs = _get_study_field_major_degree_from_file(path, with_major=False)
    for el in combs:
        print(el)

    kierunki = _get_unique_study_fields(path, "informatyka.", 1)
    print(len(kierunki))

    przedmioty_dict = _prepare_courses_dict(kierunki)
