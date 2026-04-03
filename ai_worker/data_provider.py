import os

import pandas as pd
from sqlalchemy import create_engine

from optimizer.models import ClassSessionGene

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
        ctd.frequency,
        ctd.manual_weeks,
        ctd.slots_per_class,
        g.id AS group_id,
        g.group_name,
        sp.program_name,
        COALESCE(gm.members_amount, 0) AS members_amount
    FROM study_programs sp
    JOIN study_fields sf ON sp.study_field = sf.id
    JOIN curriculum_courses cc ON cc.study_program = sp.id
    JOIN courses c ON cc.course = c.course_code
    JOIN course_type_detail ctd ON ctd.course = c.course_code
    JOIN groups g ON g.study_program = sp.id
    LEFT JOIN (
        SELECT "group" AS group_id, COUNT(student) AS members_amount
        FROM group_members
        GROUP BY "group"
    ) gm ON gm.group_id = g.id

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
CONFLICTING_GROUPS_QUERY = """
    SELECT DISTINCT gm1."group" AS group_a, gm2."group" AS group_b
    FROM group_members gm1
    JOIN group_members gm2 ON gm1.student = gm2.student
    JOIN groups g1 ON gm1."group" = g1.id
    JOIN study_programs sp1 ON g1.study_program = sp1.id
    JOIN study_fields sf1 ON sp1.study_field = sf1.id
    JOIN groups g2 ON gm2."group" = g2.id
    JOIN study_programs sp2 ON g2.study_program = sp2.id
    JOIN study_fields sf2 ON sp2.study_field = sf2.id
    WHERE gm1."group" < gm2."group"
        AND sf1.faculty = %(faculty_id)s
        AND sf2.faculty = %(faculty_id)s
"""
GROUP_MEMBERS_QUERY = """
    SELECT gm."group" AS group_id, gm.student AS student_id
    FROM group_members gm
    JOIN groups g ON gm."group" = g.id
    JOIN study_programs sp ON g.study_program = sp.id
    JOIN study_fields sf ON sp.study_field = sf.id
    WHERE sf.faculty = %(faculty_id)s
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
        - rooms: room_id, room_name, room_capacity, projector_availability,
        pc_amount, faculty_id, unit_id, building_id, building_number, campus_id, campus_short
        - employees: id, name, surname, degree, unit_id
        - requirements: course_code, class_type, course_name, class_hours, pc_needed,
        projector_needed, max_group_participants_number, group_id, group_name, program_name
        - competencies: employee_id, course_code, class_type, hours
        - conflicting_groups: group_a, group_b
        - group_members: group_id, student_id
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

        conflicts_df = pd.read_sql(
            CONFLICTING_GROUPS_QUERY,
            self.engine,
            params={"faculty_id": faculty_id},
        )
        group_members_df = pd.read_sql(
            GROUP_MEMBERS_QUERY,
            self.engine,
            params={"faculty_id": faculty_id},
        )

        return {
            "rooms": rooms_df,
            "employees": employees_df,
            "requirements": requirements_df,
            "competencies": competencies_df,
            "conflicting_groups": conflicts_df,
            "group_members": group_members_df,
        }

    @staticmethod
    def _generate_allowed_patterns(row) -> list[list[int]]:
        """
        Generates allowed patterns for a row
        :param row: row of requirements dataframe
        :return: list of allowed patterns
        """
        freq = str(row["frequency"]).upper()

        if freq == "MANUAL":
            manual_weeks = row["manual_weeks"]
            if manual_weeks is None or (
                isinstance(manual_weeks, float) and pd.isna(manual_weeks)
            ):
                return []
            return [manual_weeks]
        elif freq == "BIWEEKLY":
            return [[1, 3, 5, 7, 9, 11, 13, 15], [2, 4, 6, 8, 10, 12, 14]]
        elif freq == "FIRST_HALF":
            return [list(range(1, 8))]
        elif freq == "SECOND_HALF":
            return [list(range(8, 16))]
        else:
            return [list(range(1, 16))]

    def prepare_initial_genes(self, data: dict) -> list[ClassSessionGene]:
        """
        Prepares initial genes for a course
        :param data: dictionary with dataframes:
            - requirements: course_code, class_type, course_name, class_hours, pc_needed,
            projector_needed, max_group_participants_number
        :return: list of ClassSessionGene
        """

        requirements_df = data["requirements"]
        genes = []

        for _, row in requirements_df.iterrows():
            duration = int(row["slots_per_class"])
            patterns = self._generate_allowed_patterns(row)

            gene = ClassSessionGene(
                course_code=row["course_code"],
                class_type=row["class_type"],
                group_id=row["group_id"],
                duration_slots=duration,
                pc_needed=row["pc_needed"],
                projector_needed=row["projector_needed"],
                group_size=row["members_amount"],
                allowed_week_patterns=patterns,
                selected_pattern_index=0,
            )
            genes.append(gene)

        return genes

    @staticmethod
    def get_student_profiles(
        group_members_df: pd.DataFrame,
    ) -> tuple[dict[int, list[int]], dict[int, int]]:
        """
        Translates student profiles into groups
        :param group_members_df: dataframe with group_id and student_id
        :return: Tuple of two dictionaries:
        - group_to_profiles: {group_id: [profile_id_1, profile_id_2]}
        - profile_counts: {profile_id: students_amount}
        """
        if group_members_df.empty:
            return {}, {}
        student_groups = group_members_df.groupby("student_id")["group_id"].apply(
            frozenset
        )
        profile_counts_series = student_groups.value_counts()

        group_to_profiles = {}
        profile_counts = {}

        for profile_id, (group_set, count) in enumerate(profile_counts_series.items()):

            if not isinstance(group_set, frozenset):
                continue

            profile_counts[profile_id] = count

            for g_id in group_set:
                if g_id not in group_to_profiles:
                    group_to_profiles[g_id] = []
                group_to_profiles[g_id].append(profile_id)

        return group_to_profiles, profile_counts

    @staticmethod
    def get_conflicting_groups_dict(
        conflicting_groups_df: pd.DataFrame,
    ) -> dict[int, set[int]]:
        """
        Translates conflicting groups into groups
        :param conflicting_groups_df: dataframe with group_a and group_b
        :return: dictionary with group_id as key and set of conflicting group_ids as value
        """
        conflicts = {}
        if conflicting_groups_df.empty:
            return {}

        for a, b in zip(
            conflicting_groups_df["group_a"], conflicting_groups_df["group_b"]
        ):
            conflicts.setdefault(a, set()).add(b)
            conflicts.setdefault(b, set()).add(a)

        return conflicts

    @staticmethod
    def get_instructor_assignments(
        competencies_df: pd.DataFrame,
    ) -> dict[tuple[int, int, str], int]:
        """
        Translates competencies into instructor assignments
        :param competencies_df: dataframe with employee_id, course_code, class_type, hours
        :return: Dictionary with key as (employee_id, course_code, class_type) and value as hours
        """
        assignments = {}
        if competencies_df.empty:
            return assignments

        competencies_df["hours"] = competencies_df["hours"].fillna(0).astype(int)

        for _, row in competencies_df.iterrows():
            class_type = row["class_type"]
            if hasattr(class_type, "value"):
                class_type = class_type.value
            elif isinstance(class_type, str) and "." in class_type:
                class_type = class_type.split(".")[-1]
            key = (row["employee_id"], row["course_code"], class_type)
            assignments[key] = row["hours"]

        return assignments
