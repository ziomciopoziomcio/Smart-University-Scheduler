from sqlalchemy.orm import Session

from backend.src.academics.models import Units
from backend.src.facilities.models import Campus, Building, Faculty, Room


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
        },
        {
            "faculty_name": "Wydział Mechaniczny",
            "faculty_short": "WM",
        },
        {
            "faculty_name": "Wydział Fizyki Technicznej, Informatyki i Matematyki Stosowanej",
            "faculty_short": "WFTIMS",
        },
        {
            "faculty_name": "Wydział Organizacji i Zarządzania",
            "faculty_short": "WOIZ",
        },
        {
            "faculty_name": "Wydział Biotechnologii i Nauk o Żywności",
            "faculty_short": "WBINOŻ",
        },
        {
            "faculty_name": "Wydział Chemiczny",
            "faculty_short": "Wch",
        },
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


def generate_rooms(
    session: Session,
    faculties: dict[str, Faculty],
    units: dict[str, Units],
    buildings: dict[str, Building],
) -> dict[str, Room]:
    """
    Generates rooms and adds them to the database session.
    :param session: database session
    :param faculties: faculties
    :param units: units
    :param buildings: buildings
    :return: a dictionary mapping rooms short names to Room objects
    """
    room_map: list[dict[str, any]] = [
        {
            "room_name": "E1",
            "projector_availability": True,
            "pc_amount": 0,
            "room_capacity": 250,
            "building_short": "A10",
            "faculty_short": "WEEIA",
            "unit_short": "I24",
        },
        {
            "room_name": "E2",
            "projector_availability": True,
            "pc_amount": 0,
            "room_capacity": 220,
            "building_short": "A10",
            "faculty_short": "WEEIA",
            "unit_short": "I24",
        },
        {
            "room_name": "E5",
            "projector_availability": True,
            "pc_amount": 0,
            "room_capacity": 170,
            "building_short": "A10",
            "faculty_short": "WEEIA",
            "unit_short": "I24",
        },
        {
            "room_name": "E6",
            "projector_availability": True,
            "pc_amount": 0,
            "room_capacity": 170,
            "building_short": "A10",
            "faculty_short": "WEEIA",
            "unit_short": "I24",
        },
        {
            "room_name": "E102",
            "projector_availability": True,
            "pc_amount": 0,
            "room_capacity": 35,
            "building_short": "A10",
            "faculty_short": "WEEIA",
            "unit_short": "I24",
        },
        {
            "room_name": "E103",
            "projector_availability": True,
            "pc_amount": 0,
            "room_capacity": 35,
            "building_short": "A10",
            "faculty_short": "WEEIA",
            "unit_short": "I24",
        },
        {
            "room_name": "E104",
            "projector_availability": True,
            "pc_amount": 0,
            "room_capacity": 35,
            "building_short": "A10",
            "faculty_short": "WEEIA",
            "unit_short": "I24",
        },
        {
            "room_name": "E105",
            "projector_availability": True,
            "pc_amount": 0,
            "room_capacity": 35,
            "building_short": "A10",
            "faculty_short": "WEEIA",
            "unit_short": "I24",
        },
        {
            "room_name": "E106",
            "projector_availability": True,
            "pc_amount": 0,
            "room_capacity": 35,
            "building_short": "A10",
            "faculty_short": "WEEIA",
            "unit_short": "I24",
        },
        {
            "room_name": "E123",
            "projector_availability": True,
            "pc_amount": 0,
            "room_capacity": 20,
            "building_short": "A10",
            "faculty_short": "WEEIA",
            "unit_short": "I24",
        },
        {
            "room_name": "E3",
            "projector_availability": True,
            "pc_amount": 20,
            "room_capacity": 20,
            "building_short": "A10",
            "faculty_short": "WEEIA",
            "unit_short": "I21",
        },
        {
            "room_name": "E4",
            "projector_availability": True,
            "pc_amount": 20,
            "room_capacity": 20,
            "building_short": "A10",
            "faculty_short": "WEEIA",
            "unit_short": "I21",
        },
        {
            "room_name": "i21 408",
            "projector_availability": True,
            "pc_amount": 20,
            "room_capacity": 20,
            "building_short": "A10",
            "faculty_short": "WEEIA",
            "unit_short": "I21",
        },
        {
            "room_name": "i21 A12a/we2 147",
            "projector_availability": True,
            "pc_amount": 20,
            "room_capacity": 20,
            "building_short": "A12a",
            "faculty_short": "WEEIA",
            "unit_short": "I21",
        },
        {
            "room_name": "i21 A12a/we2 23",
            "projector_availability": True,
            "pc_amount": 20,
            "room_capacity": 20,
            "building_short": "A12a",
            "faculty_short": "WEEIA",
            "unit_short": "I21",
        },
        {
            "room_name": "i21 A12a/we2 RiS",
            "projector_availability": True,
            "pc_amount": 20,
            "room_capacity": 20,
            "building_short": "A12a",
            "faculty_short": "WEEIA",
            "unit_short": "I21",
        },
        {
            "room_name": "i21 B.A7",
            "projector_availability": True,
            "pc_amount": 20,
            "room_capacity": 20,
            "building_short": "A12b",
            "faculty_short": "WEEIA",
            "unit_short": "I21",
        },
        {
            "room_name": "i21 C3 402 St",
            "projector_availability": True,
            "pc_amount": 20,
            "room_capacity": 20,
            "building_short": "C3",
            "faculty_short": "WEEIA",
            "unit_short": "I21",
        },
        {
            "room_name": "i21 C3 403",
            "projector_availability": True,
            "pc_amount": 30,
            "room_capacity": 30,
            "building_short": "C3",
            "faculty_short": "WEEIA",
            "unit_short": "I21",
        },
        {
            "room_name": "i21 C3 404",
            "projector_availability": True,
            "pc_amount": 0,
            "room_capacity": 50,
            "building_short": "C3",
            "faculty_short": "WEEIA",
            "unit_short": "I21",
        },
        {
            "room_name": "i21 C3 410",
            "projector_availability": True,
            "pc_amount": 20,
            "room_capacity": 20,
            "building_short": "C3",
            "faculty_short": "WEEIA",
            "unit_short": "I21",
        },
        {
            "room_name": "i21 C3 411",
            "projector_availability": True,
            "pc_amount": 20,
            "room_capacity": 20,
            "building_short": "C3",
            "faculty_short": "WEEIA",
            "unit_short": "I21",
        },
        {
            "room_name": "i21 C3 412",
            "projector_availability": True,
            "pc_amount": 20,
            "room_capacity": 20,
            "building_short": "C3",
            "faculty_short": "WEEIA",
            "unit_short": "I21",
        },
        {
            "room_name": "i21 E10",
            "projector_availability": True,
            "pc_amount": 30,
            "room_capacity": 30,
            "building_short": "A10",
            "faculty_short": "WEEIA",
            "unit_short": "I21",
        },
        {
            "room_name": "i21 E100",
            "projector_availability": True,
            "pc_amount": 20,
            "room_capacity": 20,
            "building_short": "A10",
            "faculty_short": "WEEIA",
            "unit_short": "I21",
        },
    ]
    db_rooms: dict[str, Room] = {}

    for room in room_map:
        target_faculty = faculties.get(room.get("faculty_short"))
        if not target_faculty:
            print("Wrong faculty short")
            continue
        target_building = buildings.get(room.get("building_short"))
        if not target_building:
            print("Wrong building short")
            continue
        target_unit = None
        unit_short = room.get("unit_short")
        if unit_short:
            target_unit = units.get(unit_short)

        new_room = Room(
            room_name=room.get("room_name"),
            projector_availability=room.get("projector_availability"),
            pc_amount=room.get("pc_amount"),
            room_capacity=room.get("room_capacity"),
            building_id=target_building.id,
            faculty_id=target_faculty.id,
            unit_id=target_unit.id if target_unit else None,
        )
        session.add(new_room)
        db_rooms[room["room_name"]] = new_room
