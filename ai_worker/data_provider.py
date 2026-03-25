import os

import pandas as pd
from sqlalchemy import create_engine

ROOMS_QUERY = """
    SELECT
        r.id AS room_id,
        r.room_name,
        r.room_capacity,
        r.projector_availability,
        r.pc_amount,
        r.faculty_id,
        r.unit_id,
        b.id AS building_id,
        b.building_number,
        c.id AS campus_id,
        c.campus_short
    FROM rooms r
    JOIN buildings b ON r.building_id = b.id
    JOIN campuses c ON b.campus_id = c.id
    WHERE r.faculty_id = %(faculty_id)s
"""
EMPLOYEES_QUERY = """
            SELECT e.id, u.name, u.surname, u.degree, e.unit_id
            FROM employees e
            JOIN users u ON e.user_id = u.id
            WHERE e.faculty_id = %(faculty_id)s
        """
REQUIREMENTS_QUERY = """
    SELECT
        ctd.course AS course_code,
        ctd.class_type,
        c.course_name,
        ctd.class_hours,
        ctd.pc_needed,
        ctd.projector_needed,
        ctd.max_group_participants_number,
        g.id AS group_id,
        g.group_name,
        sp.program_name
    FROM study_programs sp
    JOIN study_fields sf ON sp.study_field = sf.id
    JOIN curriculum_courses cc ON cc.study_program = sp.id
    JOIN courses c ON cc.course = c.course_code
    JOIN course_type_detail ctd ON ctd.course = c.course_code
    JOIN groups g ON g.study_program = sp.id
    WHERE sf.faculty = %(faculty_id)s
      AND (cc.major IS NULL OR cc.major = g.major)
      AND (cc.elective_block IS NULL OR cc.elective_block = g.elective_block)
"""
COMPETENCIES_QUERY = """
    SELECT
        ci.employee AS employee_id,
        ci.course AS course_code,
        ci.class_type,
        ci.hours
    FROM courses_instructors ci
    JOIN employees e ON ci.employee = e.id
    WHERE e.faculty_id = %(faculty_id)s
"""


class DataProvider:
    """Class responsible for providing data from DB to AI worker. It uses SQLAlchemy to connect to the database and pandas to handle dataframes."""

    def __init__(self):
        """Constructor for DataProvider."""
        self.engine = create_engine(os.getenv("DATABASE_URL"))

    def get_all_data(self, faculty_id: int) -> dict:
        """
        Downloads all necessary data from DB
        :param faculty_id: faculty id
        :return: dictionary with dataframes:
        - rooms: id, room_name, room_capacity, projector_availability, pc_amount, building_number, campus_short
        - employees: id, name, surname, degree, unit_id
        - requirements: course_code, class_type, course_name, class_hours, pc_needed,
        projector_needed, max_group_participants_number, group_id, group_name, program_name
        - competencies: employee_id, course_code, class_type, hours
        """

        rooms_df = pd.read_sql(
            ROOMS_QUERY,
            self.engine,
            params={"faculty_id": faculty_id},
        )

        employees_df = pd.read_sql(
            EMPLOYEES_QUERY,
            self.engine,
            params={"faculty_id": faculty_id},
        )

        requirements_df = pd.read_sql(
            REQUIREMENTS_QUERY,
            self.engine,
            params={"faculty_id": faculty_id},
        )

        competencies_df = pd.read_sql(
            COMPETENCIES_QUERY,
            self.engine,
            params={"faculty_id": faculty_id},
        )

        return {
            "rooms": rooms_df,
            "employees": employees_df,
            "requirements": requirements_df,
            "competencies": competencies_df,
        }
