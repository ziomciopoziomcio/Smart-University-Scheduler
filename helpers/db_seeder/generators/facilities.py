from backend.src.facilities.models import Campus


def generate_campuses(session):
    campuses = [
        {"campus_short": "A", "campus_name": "Kampus A"},
        {"campus_short": "B", "campus_name": "Kampus B"},
        {"campus_short": "C", "campus_name": "Kampus C"},
    ]

    db_campuses = {}

    for campus in campuses:
        campus_data = Campus(**campus)
        session.add(campus_data)
        db_campuses[campus_data.campus_short] = campus_data

    session.flush()

    return db_campuses
