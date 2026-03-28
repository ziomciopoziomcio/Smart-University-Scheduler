from sqlalchemy.orm import Session
import json


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
