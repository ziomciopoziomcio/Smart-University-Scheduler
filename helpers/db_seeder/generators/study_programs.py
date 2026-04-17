import json
from sqlalchemy.orm import Session

from backend.src.courses.models import Study_fields, Study_program


def _create_description(study_field_name: str, start_year: str, deg: int) -> str:
    """
    Generates a description of a study field.
    :param study_field_name: study field name
    :param start_year: start year
    :return: description
    """

    return f"{study_field_name.capitalize()} {start_year} ({deg}. stopień)"


def _get_study_field_major_degree_from_file(sourcefile: str, with_major=True):
    with open(sourcefile, "r", encoding="utf-8") as f:
        data = json.load(f)

    combs: set[tuple[str, int, str | None]] = set()

    for kierunek in data:
        nazwa = kierunek.get("nazwa", None)
        stopien = kierunek.get("stopien", None)
        if with_major:
            specjalizacja = kierunek.get("specjalizacja", None)
        else:
            specjalizacja = None
        if nazwa is None or stopien is None:
            continue

        combs.add((nazwa, int(stopien), specjalizacja))
    combs = sorted(list(combs))
    return combs


def generate_study_programs(
    session: Session, sourcefile: str, db_study_fields: dict[str, Study_fields]
) -> dict[tuple[str, str, int], Study_program]:
    """
    Generates study programs.
    :param session: database session
    :param sourcefile: path to JSON file containing study field data
    :param db_study_fields: dictionary mapping study field names to Study_fields
    :return: dictionary mapping (study_field_name, start_year, degree) to Study_program
    """
    start_years = ["2023/24"]

    db_study_programs: dict[tuple[str, str, int], Study_program] = {}
    # study_field_name, start_year, degree

    combs = _get_study_field_major_degree_from_file(sourcefile, with_major=False)
    for el in combs:
        print(el)

    for uc in combs:
        for start_year in start_years:
            study_field_name = uc[0]
            study_degree = uc[1]

            description = _create_description(
                study_field_name, start_year, study_degree
            )

            print(f"Processing: {study_field_name} - {study_degree} - {description}")
            study_field_obj = db_study_fields.get(study_field_name, None)
            if study_field_obj is None:
                print(f"Cannot study field {study_field_name}")
                continue

            study_field_id = study_field_obj.id

            # add to db
            sp_obj = Study_program(
                study_field=study_field_id,
                start_year=start_year,
                program_name=description,
            )
            session.add(sp_obj)
            db_study_programs[(study_field_name, start_year, study_degree)] = sp_obj

    session.flush()
    return db_study_programs
