from sqlalchemy.orm import Session

from backend.src.facilities.models import Campus, Building, Faculty


def generate_campuses(session: Session) -> dict[str, Campus]:
    """
    Generates campuses and adds them to the database session.
    :param session: database session
    :return: a dictionary mapping campus short names to Campus objects
    """
    campuses = [
        {"campus_short": "A", "campus_name": "Kampus A"},
        {"campus_short": "B", "campus_name": "Kampus B"},
        {"campus_short": "C", "campus_name": "Kampus C"},
    ]

    db_campuses: dict[str, Campus] = {}

    for campus in campuses:
        campus_data = Campus(**campus)
        session.add(campus_data)
        db_campuses[campus_data.campus_short] = campus_data

    session.flush()

    return db_campuses


def generate_faculties(session: Session) -> dict[str, Faculty]:
    """
    Generates faculties and adds them to the database session.
    :param session: database session
    :return: a dictionary mapping faculty short names to Faculty objects
    """
    faculties_data: list[dict[str, str]] = [
        {
            "faculty_name": "Wydział Elektrotechniki, Elektroniki, Informatyki i Automatyki",
            "faculty_short": "WEEIA",
        }
    ]
    db_faculties: dict[str, Faculty] = {}
    for faculty in faculties_data:
        faculty_data = Faculty(**faculty)
        session.add(faculty_data)
        db_faculties[faculty_data.faculty_short] = faculty_data

    session.flush()
    return db_faculties


def generate_buildings(
    session: Session, campuses: dict[str, Campus]
) -> dict[str, Building]:
    """
    Generates buildings and adds them to the database session.
    NOTE! REMEMBER TO ADD FACULTIES
    :param session: database session
    :param campuses: campuses
    :return: a dictionary mapping campus short names to Building objects
    """
    buildings_map: dict[str, list[str]] = {
        "A": ["A10", "A11", "A12a", "A12b", "A15"],
        "B": ["B9", "B18", "B19"],
        "C": ["C3", "C6", "C8"],
    }

    db_buildings: dict[str, Building] = {}

    for campus in campuses.values():
        target_buildings = buildings_map.get(campus.campus_short, [])

        for building_number in target_buildings:
            building = Building(building_number=building_number, campus_id=campus.id)
            session.add(building)
            db_buildings[building_number] = building

    session.flush()
    return db_buildings
