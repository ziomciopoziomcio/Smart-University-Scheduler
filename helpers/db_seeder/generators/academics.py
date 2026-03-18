from sqlalchemy.orm import Session

from backend.src.academics.models import Units
from backend.src.facilities.models import Faculty


def generate_units(session: Session, faculties: dict[str, Faculty]) -> dict[str, Units]:
    """
    Generates the units table
    :param session: database session
    :param faculties: a dict of faculties
    :return: a dict of units
    """
    units: list[dict[str, str]] = [
        {
            "unit_short": "I24",
            "unit_name": "Instytut Informatyki Stosowanej",
            "faculty_short": "WEEIA",
        },
        {
            "unit_short": "I21",
            "unit_name": "Instytut Automatyki",
            "faculty_short": "WEEIA",
        },
        {
            "unit_short": "I22",
            "unit_name": "Instytut Elektroenergetyki",
            "faculty_short": "WEEIA",
        },
        {
            "unit_short": "I23",
            "unit_name": "Instytut Elektroniki",
            "faculty_short": "WEEIA",
        },
        {
            "unit_short": "I25",
            "unit_name": "Instytut Mechatroniki i Systemów Informatycznych",
            "faculty_short": "WEEIA",
        },
        {
            "unit_short": "K21",
            "unit_name": "Katedra Aparatów Elektrycznych",
            "faculty_short": "WEEIA",
        },
        {
            "unit_short": "K22",
            "unit_name": "Katedra Mikroelektroniki i Technik Informatycznych",
            "faculty_short": "WEEIA",
        },
        {
            "unit_short": "K23",
            "unit_name": "Katedra Przyrządów Półprzewodnikowych i Optoelektronicznych",
            "faculty_short": "WEEIA",
        },
    ]

    db_units: dict[str, Units] = {}

    for unit_data in units:
        parent_faculty = faculties.get(unit_data["faculty_short"])

        if not parent_faculty:
            print("Wrong data - faculty not found")
            continue

        unit = Units(
            unit_name=unit_data["unit_name"],
            unit_short=unit_data["unit_short"],
            faculty_id=parent_faculty.id,
        )
        session.add(unit)
        db_units[unit_data["unit_short"]] = unit

    session.flush()
    return db_units
