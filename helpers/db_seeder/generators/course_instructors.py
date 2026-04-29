import json
import re
import math


from sqlalchemy.orm import Session
from backend.src.courses.models import Course, ClassType, Courses_instructors
from backend.src.users.models import Users
from backend.src.academics.models import Employees

PATH_TO_FINAL_PROGRAMS = "../../data_collector/final-programy.json"


def _normalize_whitespace(text: str) -> str:
    """
    Normalize whitespace
    :param text: input text
    :return: normalized text
    """
    return re.sub(r"\s+", " ", text).strip()


def clean_teacher_txt(text: str) -> str:
    """
    Cleans and normalizes a raw teacher text string.
    :param text: input text
    :return: cleaned text
    """
    if not text:
        return ""

    text = _normalize_whitespace(text)
    text = re.sub(r"^-+\s*", "", text)
    return _normalize_whitespace(text)


def extract_degree_and_name(text: str) -> tuple[str, str]:
    """
    For example:
    'prof. dr hab. inż. Jan Kowalski' -> ('prof. dr hab. inż.', 'Jan Kowalski')
    'dr inż. Piotr Duch' -> ('dr inż.', 'Piotr Duch')
    'Aleksandra Urbaniak' -> ('', 'Aleksandra Urbaniak')
    """
    text = clean_teacher_txt(text)
    if not text:
        return "", ""

    degree_patterns = [
        r"^prof\.\s*dr\s*hab\.\s*inż\.",
        r"^prof\.\s*dr\s*hab\.",
        r"^dr\s*hab\.\s*inż\.",
        r"^dr\s*hab\.",
        r"^dr\s*inż\.",
        r"^mgr\s*inż\.",
        r"^mgr\b",
        r"^dr\b",
        r"^inż\.",
    ]

    for pattern in degree_patterns:
        match = re.match(pattern, text, flags=re.IGNORECASE)
        if match:
            degree = _normalize_whitespace(match.group(0))
            name = _normalize_whitespace(text[match.end() :])
            return degree, name

    return "", text


def rank_degree(degree: str) -> int:
    """
    Returns a numeric rank representing the academic degree hierarchy.
    :param degree: degree as string
    :return: rank
    """
    ranking = {
        "prof. dr hab. inż.": 8,
        "prof. dr hab.": 7,
        "dr hab. inż.": 6,
        "dr hab.": 5,
        "dr inż.": 4,
        "dr": 3,
        "mgr inż.": 2,
        "mgr": 1,
        "inż.": 0,
        "": -1,
    }
    return ranking.get(degree.lower().strip(), -1)


def split_name(name: str) -> tuple[str, str]:
    """
     Splits a full name string into first name(s) and last name.
    :param name: Full name as string
    :return: separated name and last name
    """
    name = _normalize_whitespace(name)
    if not name:
        return "", ""

    parts = name.split(" ")
    if len(parts) == 1:
        return parts[0], ""

    first_name = " ".join(parts[:-1])
    last_name = parts[-1]
    return first_name, last_name


def _add_person(people: dict[str, dict], raw_person: str) -> None:
    """
    Adds or updates a person entry in the `people` dictionary based on raw text input.
    :param people: people data
    :param raw_person: raw input string representing a person
    :return: None
    """
    cleaned = clean_teacher_txt(raw_person)
    if not cleaned:
        return

    degree, full_name = extract_degree_and_name(cleaned)
    if not full_name:
        return

    first_name, last_name = split_name(full_name)
    if not first_name and not last_name:
        return

    if len(first_name) > 30:
        return

    key = f"{first_name.lower()}|{last_name.lower()}"
    new_rank = rank_degree(degree)

    if key not in people:
        people[key] = {
            "first_name": first_name,
            "last_name": last_name,
            "degree": degree,
        }
        return

    old_rank = rank_degree(people[key]["degree"])
    if new_rank > old_rank:
        people[key]["degree"] = degree


def _parse_course_code(course_code: str) -> int:
    """
    Extracts digits from a course code string and converts them to an integer.
    :param course_code: String containing a course code.
    :return: Course code as an integer.
    """

    digits = re.sub(r"\D", "", course_code)
    return int(digits) if digits else 0


def _round_up_to_multiple(x: float, y: int) -> int:
    """
    Rounds x up to multiple of y.
    :param x: float number.
    :param y: int number to round to.
    :return: rounded number.
    """
    return math.ceil(x / y) * y


def _find_teachers(
    teachers: list[dict[str, str]], string: str
) -> dict[str, str] | None:
    """
    Finds a teacher in the list of teachers based on the presence of their first and last name in the given string.
    :param teachers: list of teachers.
    :param string: string containing name and surname of the teacher
    :return: dictionary representing the teacher if found, otherwise None.
    """
    for el in teachers:
        name = el.get("first_name", None)
        lastname = el.get("last_name", None)

        if name is None or lastname is None:
            continue

        if name in string and lastname in string:
            return el

    return None


def _get_hours_dict(subject) -> dict[str, str]:
    """
    Extracts hours information for different class types from the subject dictionary.
    :param subject: subject dictionary.
    :return: dictionary with class types as keys and corresponding hours as values.
    """
    hours_dict: dict[str, str] = {}
    forms = ["W", "Ć", "L", "S", "I", "E-Learn."]
    for form in forms:
        hour = subject.get(form, None)
        if hour is not None:
            hours_dict[form] = hour
    return hours_dict


def _get_hours_needed(subject: dict, num_of_groups: int) -> dict[str, int]:
    """
    Computes the required number of teaching hours for each class type in a subject.
    The function:
    - Retrieves a dictionary of base hours per class type using `_get_hours_dict`.
    - Multiplies hours by the number of groups for all non-lecture classes.
    - Keeps lecture ("W") hours unchanged (multiplied by 1).
    - Skips entries with empty hour values.

    :param subject: dictionary containing subject data
    :param num_of_groups: number of groups
    :return: dictionary with class types as keys and required hours as values
    """
    hours: dict[str, str] = _get_hours_dict(subject)
    res: dict[str, int] = {}
    for k, v in zip(hours.keys(), hours.values()):
        if v == "":
            continue

        if k.upper() != "W":
            res[k] = int(v) * num_of_groups
        else:
            res[k] = int(v) * 1

    return res


def _get_all_teachers(
    subject: dict, teachers: list[dict[str, str]]
) -> list[dict[str, str]]:
    """
    Gets all teachers (course leader and instructors) in one list
    :param subject: dictionary representing subject data
    :param teachers: teacher list
    :return: all teachers for the subject in one list
    """
    all_teachers = [subject.get("kierownik", "")] + subject.get("realizatorzy", [])

    all_teachers_dict: list[dict[str, str]] = []
    for el in all_teachers:
        found = _find_teachers(teachers, el)
        if found is not None and found not in all_teachers_dict:
            all_teachers_dict.append(found)

    return all_teachers_dict


def _find_teacher_obj(
    degree: str,
    name: str,
    lastname: str,
    teachers: dict[tuple[str | None, str, str, str, str], Users],
) -> Users | None:
    """
    Searches for a teacher object in a nested teacher structure based on degree, name, and surname.
    :param degree: degree of the teacher
    :param name: name of the teacher
    :param lastname: lastname of the teacher
    :param teachers: teachers list
    :return: found teacher object or None if not found
    """
    for (d, n, s, _, _), user in teachers.items():
        if d == degree and n == name and s == lastname:
            return user
    return None


def _map_course_type(class_type: str) -> ClassType | None:
    """
    Maps course types
    :param class_type: Course type as string
    :return: Course type as enum
    """
    if class_type == "W":
        return ClassType.LECTURE
    elif class_type == "Ć":
        return ClassType.TUTORIALS
    elif class_type == "L":
        return ClassType.LABORATORY
    elif class_type == "S":
        return ClassType.SEMINAR
    elif class_type == "E-Learn.":
        return ClassType.ELEARNING
    elif class_type == "I":
        return ClassType.OTHER
    return None


def _get_employee_id_by_user_id(
    db_employees: dict[tuple[str | None, str, str], Employees], user_id: int
) -> int | None:
    for e_obj in db_employees.values():
        if e_obj.user_id == user_id:
            return e_obj.id
    return None


def _add_course_instructors_to_db(
    session: Session,
    entries: dict[tuple[str, str, str, int, str], int],
    teachers: dict[tuple[str | None, str, str, str, str], Users],
    courses: dict[int, Course],
    db_employees: dict[tuple[str | None, str, str], Employees],
) -> dict[tuple[str, str, str, int, str], Courses_instructors]:
    """
    Inserts course instructor assignments into the database session based on
    aggregated teaching entries.
    :param session: database session
    :param entries: dict mapping of (name, surname, degree, course_code, class_form) to hours.
    :param teachers: teachers data generated by generate_users function
    :param courses: courses data generated by generate_courses function
    :param db_employees: employees data generated by generate_employees function
    :return: dict mapping of (name, surname, degree, course_code, class_form) to created Courses_instructors objects
    """
    db_course_instructors: dict[tuple[str, str, str, int, str], Courses_instructors] = (
        {}
    )
    for k, v in zip(entries.keys(), entries.values()):
        name, lastname, degree, cc, form = k
        # get course
        course_obj: Course | None = courses.get(cc, None)
        if course_obj is None:
            print(f"Course not found for course code {cc}")
            continue
        course_id = course_obj.course_code

        # get teacher
        teacher_obj: Users | None = _find_teacher_obj(degree, name, lastname, teachers)
        if teacher_obj is None:
            print(f"Teacher not found for {name} {lastname} with degree {degree}")
            continue
        teacher_id = teacher_obj.id

        # get form
        type: ClassType | None = _map_course_type(form)
        if type is None:
            print(f"Unknown class type {form} for course code {cc}")
            continue

        # get hours
        hours: int = v

        # map user to employee
        teacher_id = teacher_obj.id
        emp_id = _get_employee_id_by_user_id(db_employees, teacher_id)
        if emp_id is None:
            print("Employee not found!")
            continue

        # course_instructor object
        ci_obj = Courses_instructors(
            employee=emp_id, course=course_id, class_type=type, hours=hours
        )
        session.add(ci_obj)
        db_course_instructors[k] = ci_obj

    return db_course_instructors


def _debug_print(debug: bool, text: str) -> None:
    """
    Prints a debug message if debugging mode is enabled.
    :param debug: flag indicating whether to print the message
    :param text: text to print
    :return: None
    """
    if debug:
        print(text)


def extract_teachers(
    sourcefile: str = PATH_TO_FINAL_PROGRAMS,
) -> list[dict[str, str]]:
    """
    Extracts unique teachers from a JSON file.
    :param sourcefile: path to JSON file containing study field data
    :return: a sorted list of unique teachers
    """
    with open(sourcefile, "r", encoding="utf-8") as f:
        data = json.load(f)

    people: dict[str, dict[str, str]] = {}

    for kierunek in data:
        for semestr in kierunek.get("semestry", []):
            for przedmiot in semestr.get("przedmioty", []):
                kierownik = przedmiot.get("kierownik", "")
                if kierownik:
                    _add_person(people, kierownik)

                for realizator in przedmiot.get("realizatorzy", []):
                    _add_person(people, realizator)

    return sorted(
        people.values(), key=lambda x: (x["last_name"].lower(), x["first_name"].lower())
    )


def _get_course_instructor_key(
    teacher: dict[str, str], course_code: int, course_type: str
) -> tuple[str, str, str, int, str]:
    """
    Generates course instructor key
    :param teacher: teacher dict
    :param course_code: course code
    :param course_type: course type
    :return: key representing course_instructor
    """
    key = (
        teacher["first_name"],
        teacher["last_name"],
        teacher["degree"],
        course_code,
        course_type,
    )
    return key


def _update_unique_entries(
    key: tuple[str, str, str, int, str],
    unique_entries: dict[tuple[str, str, str, int, str], int],
    curr_hours: int,
) -> dict[tuple[str, str, str, int, str], int]:
    """
    Updates unique entries
    :param key: current key
    :param unique_entries: dict containing unique entries
    :param curr_hours: new hours
    :return: updated unique entries
    """
    if key in unique_entries.keys():
        curr = unique_entries[key]
        curr += curr_hours
        unique_entries[key] = curr
    else:
        unique_entries[key] = curr_hours
    return unique_entries


def generate_course_instructors(
    session: Session,
    sourcefile: str,
    num_of_groups: int,
    db_teachers: dict[tuple[str | None, str, str, str, str], Users],
    db_courses: dict[int, Course],
    db_employees: dict[tuple[str | None, str, str], Employees],
    debug: bool = True,
) -> dict[tuple[str, str, str, int, str], Courses_instructors]:
    """
    Generates courses instructors and adding them to db.
    :param session: database session
    :param sourcefile: path to JSON file containing study field data
    :param num_of_groups: number of groups to generate
    :param db_teachers: teachers data generated by generate_users function
    :param db_courses: courses data generated by generate_courses function
    :param db_employees: employees data generated by generate_employees function
    :param debug: flag indicating whether to print the message
    :return: dict mapping name, lastname, degree, course_code, class_type to hours
    """

    teachers = extract_teachers(sourcefile=sourcefile)

    with open(sourcefile, "r", encoding="utf-8") as f:
        data = json.load(f)

    unique_entries: dict[tuple[str, str, str, int, str], int] = {}
    # name, lastname, degree, course_code, class_type, hours

    for kierunek in data:
        for semestr in kierunek.get("semestry", []):
            for przedmiot in semestr.get("przedmioty", []):
                subject_name = przedmiot["Nazwa przedmiotu w języku polskim"]
                course_code = _parse_course_code(przedmiot.get("Kod przedmiotu", ""))

                hours_needed = _get_hours_needed(przedmiot, num_of_groups=num_of_groups)
                all_teachers = _get_all_teachers(przedmiot, teachers)
                num_of_teachers = len(all_teachers)

                _debug_print(debug, f"{subject_name} - {course_code}")
                _debug_print(debug, f"{all_teachers} ({num_of_teachers})")
                _debug_print(debug, f"{hours_needed}")

                hours_dict = _get_hours_dict(przedmiot)

                for form in hours_needed.keys():
                    _debug_print(debug, form)
                    if form == "W":
                        if num_of_teachers > 0:
                            curr_hours = hours_needed[form]
                            _debug_print(debug, f"{all_teachers[0]} : {curr_hours}")

                            key: tuple[str, str, str, int, str] = (
                                _get_course_instructor_key(
                                    all_teachers[0], course_code, form
                                )
                            )
                            _update_unique_entries(key, unique_entries, curr_hours)

                    else:
                        if num_of_teachers > 0:
                            for t in all_teachers:
                                curr_hours = _round_up_to_multiple(
                                    hours_needed[form] / num_of_teachers,
                                    int(hours_dict[form]),
                                )
                                _debug_print(debug, f"{t} : {curr_hours}")

                                key: tuple[str, str, str, int, str] = (
                                    _get_course_instructor_key(t, course_code, form)
                                )
                                _update_unique_entries(key, unique_entries, curr_hours)
                        else:
                            _debug_print(
                                debug,
                                f"Skipping form {form} for {subject_name} - {course_code}: no teachers assigned",
                            )

                _debug_print(debug, "")
                _debug_print(debug, "")

    for entry in unique_entries:
        _debug_print(debug, f"{entry} - {unique_entries[entry]}")

    # add to db
    db_course_instructors: dict[tuple[str, str, str, int, str], Courses_instructors] = (
        _add_course_instructors_to_db(
            session, unique_entries, db_teachers, db_courses, db_employees
        )
    )

    session.flush()
    return db_course_instructors
