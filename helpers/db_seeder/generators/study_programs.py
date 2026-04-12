from sqlalchemy.orm import Session

from backend.src.courses.models import Study_fields, Study_program

def _create_description(study_field_name: str, start_year: str):
    """
    Generates a description of a study field.
    :param study_field_name: study field name
    :param start_year: start year
    :return: description
    """
    return f"{study_field_name.capitalize()} - {start_year}"


def generate_study_programs(
    session: Session,
    db_study_fields: dict[str, Study_fields],
) -> dict[tuple[str, str], Study_program]:
    """
    Generates study programs.
    :param session: database session
    :param db_study_fields: dictionary mapping study field names to Study_fields
    :return: dictionary mapping (study_field_name, start_year) to Study_program
    """
    start_years = ["2023/24"]

    db_study_programmes: dict[tuple[str, str], Study_program] = {}
    # study_field_name, start_year

    for study_field_name in db_study_fields.keys():
        for start_year in start_years:
            description = _create_description(study_field_name, start_year)

            study_field_obj = db_study_fields.get(study_field_name, None)
            if study_field_obj is None:
                print(f"Study field {study_field_name} not found in database")
                continue

            study_field_id = study_field_obj.id

            # add to db
            sp_obj = Study_program(
                study_field=study_field_id,
                start_year=start_year,
                program_name=description,
            )
            session.add(sp_obj)
            db_study_programmes[study_field_name, start_year] = sp_obj

    session.flush()
    return db_study_programmes
