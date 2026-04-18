import pytest
from src.facilities.models import Campus, Building, Faculty, Room


@pytest.fixture
def create_test_campus(db_session):
    """Factory fixture to create a test campus."""

    def _create(campus_name="Main Campus", campus_short="MAIN"):

        campus = db_session.query(Campus).filter_by(campus_name=campus_name).first()
        if not campus:
            campus = Campus(campus_name=campus_name, campus_short=campus_short)
            db_session.add(campus)
            db_session.commit()
            db_session.refresh(campus)
        return campus

    return _create


@pytest.fixture
def create_test_building(db_session, create_test_campus):
    """Factory fixture to create a test building."""

    def _create(
        building_number="B18",
        building_name="Information Technologies Center",
        campus_id=None,
    ):

        if campus_id is None:
            safe_num = building_number.replace(" ", "_")
            campus = create_test_campus(
                campus_name=f"Campus_for_{safe_num}", campus_short=f"C_{safe_num}"
            )
            campus_id = campus.id

        building = (
            db_session.query(Building)
            .filter_by(building_number=building_number)
            .first()
        )
        if not building:
            building = Building(
                building_number=building_number,
                building_name=building_name,
                campus_id=campus_id,
            )
            db_session.add(building)
            db_session.commit()
            db_session.refresh(building)

        return building

    return _create


@pytest.fixture
def create_test_faculty(db_session):
    """Factory fixture to create a test faculty."""

    def _create(faculty_name="Faculty of Test", faculty_short="FT"):

        faculty = db_session.query(Faculty).filter_by(faculty_name=faculty_name).first()
        if not faculty:
            faculty = Faculty(faculty_name=faculty_name, faculty_short=faculty_short)
            db_session.add(faculty)
            db_session.commit()
            db_session.refresh(faculty)

        return faculty

    return _create


@pytest.fixture
def create_test_room(db_session, create_test_building, create_test_faculty):
    """Factory fixture to create a test room."""

    def _create(room_name="101A", building_id=None, faculty_id=None):

        if building_id is None:
            safe_b = room_name.replace(" ", "_")
            building = create_test_building(
                building_number=f"B_Room_{safe_b}",
                building_name=f"Building for {safe_b}",
            )
            building_id = building.id

        if faculty_id is None:
            safe_f = room_name.replace(" ", "_")
            faculty = create_test_faculty(
                faculty_name=f"Faculty_{safe_f}", faculty_short=f"F_{safe_f}"
            )
            faculty_id = faculty.id

        room = (
            db_session.query(Room)
            .filter_by(room_name=room_name, building_id=building_id)
            .first()
        )
        if not room:
            room = Room(
                room_name=room_name,
                building_id=building_id,
                faculty_id=faculty_id,
                pc_amount=15,
                room_capacity=30,
                projector_availability=True,
            )
            db_session.add(room)
            db_session.commit()
            db_session.refresh(room)

        return room

    return _create
