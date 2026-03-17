from sqlalchemy.orm import Session
from backend.src.facilities.models import Campus, Building


def generate_campuses(session: Session) -> dict[str, Campus]:
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


def generate_buildings(
    session: Session, campuses: dict[str, Campus]
) -> dict[str, Building]:
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
