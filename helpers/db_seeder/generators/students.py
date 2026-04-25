from sqlalchemy.orm import Session

from backend.src.users.models import Users
from backend.src.academics.models import Students, Groups
from backend.src.courses.models import Study_program, Curriculum_course, Major


def _get_only_students(
    db_users: dict[tuple[str | None, str, str, str, str, bool], Users],
):
    students: dict[tuple[str | None, str, str, str, str], Users] = {}
    for key in db_users:
        if key[5]:
            new_key = (key[0], key[1], key[2], key[3], key[4])
            students[new_key] = db_users[key]
    return students


def _get_all_study_programs_with(
    study_field_name: str,
    degree: int,
    db_study_programs: dict[tuple[str, str, int], Study_program],
):
    res = []
    for obj in db_study_programs.values():
        if (
            study_field_name in obj.program_name
            and f"{degree}. stopień" in obj.program_name
        ):
            res.append(obj)
    return res


def _get_majors_from_study_program(
    study_program: Study_program,
    db_curr_courses: dict[
        tuple[str | None, int, int, str | None, str | None], Curriculum_course
    ],
):
    majors_ids = set()

    sp_id = study_program.id
    for cc_obj in db_curr_courses.values():
        if cc_obj.study_program == sp_id and cc_obj.major:
            majors_ids.add(cc_obj.major)

    return list(majors_ids)


def _assign_students_to_study_program(
    amount_of_students: dict,
    students: dict[tuple[str | None, str, str, str, str], Users],
    db_study_programs: dict[tuple[str, str, int], Study_program],
    db_curr_courses: dict[
        tuple[str | None, int, int, str | None, str | None], Curriculum_course
    ],
):
    students_objs = []
    users_list = list(students.values())
    idx = 0

    for study_field_name, degree in amount_of_students:
        for sp in _get_all_study_programs_with(
            study_field_name, degree, db_study_programs
        ):
            majors_ids = _get_majors_from_study_program(sp, db_curr_courses)
            if not majors_ids:
                majors_ids = [None]
            m_idx = 0
            len_majors = len(majors_ids)

            amount = amount_of_students[(study_field_name, degree)]
            while amount > 0:
                amount -= 1
                user_obj = users_list[idx]
                idx += 1
                student_obj = Students(
                    user_id=user_obj.id,
                    study_program=sp.id,
                    major=majors_ids[m_idx % len_majors],
                )
                m_idx += 1
                students_objs.append(student_obj)
    return students_objs


def _get_major_name_by_id(
    db_majors: dict[tuple[str, str], Major], m_id: int | None
) -> str | None:
    if m_id is None:
        return None
    for major_obj in db_majors.values():
        if major_obj.id == m_id:
            return major_obj.major_name
    return None


def _get_email_by_user_id(
    db_not_teachers: dict[tuple[str | None, str, str, str, str, bool], Users], u_id: int
) -> str:
    for user_obj in db_not_teachers.values():
        if user_obj.id == u_id:
            return user_obj.email
    raise KeyError(f"User with id {u_id} not found")


def _get_study_program_name_by_id(
    db_study_programs: dict[tuple[str, str, int], Study_program], sp_id: int
) -> str | None:
    for sp_obj in db_study_programs.values():
        if sp_obj.id == sp_id:
            return sp_obj.program_name
    raise KeyError(f"Study program with id {sp_id} not found")


def _get_specified_study_program(
    db_study_programs: dict[tuple[str, str, int], Study_program],
    study_field: str,
    degree: str,
    year: int,
) -> Study_program | None:
    key_words = [study_field, f"({degree}. stopień)"]

    matches_per_name: list[Study_program] = []
    for sp_obj in db_study_programs.values():
        program_name = sp_obj.program_name
        if program_name is None:
            continue
        program_name = program_name.lower()

        match = True
        for kw in key_words:
            if kw not in program_name:
                match = False
                break

        if not match:
            continue

        matches_per_name.append(sp_obj)

    if len(matches_per_name) < year:
        return None

    return matches_per_name[-year]


def _get_groups_from_study_program(
    db_major_groups: dict[str, Groups], sp_id: int
) -> list[Groups]:
    res: list[Groups] = []
    for g_obj in db_major_groups.values():
        if g_obj.study_program == sp_id:
            res.append(g_obj)

    return res


def _get_unique_major_ids_from_groups(groups: list[Groups]) -> list[int]:
    major_ids: set[int] = set()

    for g_obj in groups:
        m_id = g_obj.major
        if m_id is not None:
            major_ids.add(m_id)

    return list(major_ids)


def generate_students(
    session: Session,
    db_not_teachers: dict[tuple[str | None, str, str, str, str, bool], Users],
    db_study_programs: dict[tuple[str, str, int], Study_program],
    db_curr_courses: dict[
        tuple[str | None, int, int, str | None, str | None], Curriculum_course
    ],
    db_majors: dict[tuple[str, str], Major],
    db_major_groups: dict[str, Groups],
) -> dict[tuple[str, str | None, str | None], Students]:
    """
    Generates Students objects by assigning Users to study programs and majors
    :param session: database session
    :param db_not_teachers: not teacher users generated by generate_users
    :param db_study_programs: study programs generated by generate_study_programs
    :param db_curr_courses: curriculum courses generated by generate_curriculum_courses
    :return: students
    """
    db_students: dict[tuple[str, str | None, str | None], Students] = {}
    # email, study_program_name, major_name
    amount_of_students: dict = {
        ("automatyka i sterowanie robotów", 1, 1): 90,
        ("automatyka i sterowanie robotów", 1, 2): 75,
        ("automatyka i sterowanie robotów", 1, 3): 45,
        ("biomedical engineering and technologies", 1, 1): 60,
        ("biomedical engineering and technologies", 1, 2): 30,
        ("biomedical engineering and technologies", 1, 3): 30,
        ("computer science", 1, 1): 75,
        ("computer science", 1, 2): 60,
        ("computer science", 1, 3): 45,
        ("computer science and information technology", 2, 1): 75,
        ("computer science and information technology", 2, 2): 30,
        ("elektronika i telekomunikacja", 1, 1): 60,
        ("elektronika i telekomunikacja", 1, 2): 45,
        ("elektronika i telekomunikacja", 1, 3): 30,
        ("elektrotechnika", 2, 1): 60,
        ("elektrotechnika", 2, 2): 30,
        ("informatyka", 1, 1): 220,
        ("informatyka", 1, 2): 160,
        ("informatyka", 1, 3): 160,
        ("informatyka", 2, 1): 70,
        ("informatyka", 2, 2): 30,
    }
    students = _get_only_students(db_not_teachers)
    students_objects = list(students.values())
    student_idx = 0

    for sp_tuple, num_of_students in amount_of_students.items():
        # get study program object
        sf_name, degree, year = sp_tuple
        sp_obj = _get_specified_study_program(db_study_programs, sf_name, degree, year)
        if sp_obj is None:
            raise KeyError("Study program not found")

        # get groups in sp
        major_groups = _get_groups_from_study_program(db_major_groups, sp_obj.id)

        # students with major = None
        if len(major_groups) == 0:
            for _ in range(num_of_students):
                user_obj = students_objects[student_idx]
                student_idx += 1

                s_obj = Students(
                    user_id=user_obj.id, study_program=sp_obj.id, major=None
                )
                session.add(s_obj)
                db_students[(user_obj.email, sp_obj.program_name, None)] = s_obj

        else:
            # get majors ids from groups in sp
            unique_major_ids: list[int] = _get_unique_major_ids_from_groups(
                groups=major_groups
            )
            major_idx = 0
            num_of_unique_majors = len(unique_major_ids)

            for _ in range(num_of_students):
                user_obj = students_objects[student_idx]
                student_idx += 1

                major_id: int = unique_major_ids[major_idx]
                major_idx += 1
                if major_idx == num_of_unique_majors:
                    major_idx = 0

                s_obj = Students(
                    user_id=user_obj.id, study_program=sp_obj.id, major=major_id
                )
                session.add(s_obj)
                major_name = _get_major_name_by_id(db_majors=db_majors, m_id=major_id)
                db_students[(user_obj.email, sp_obj.program_name, major_name)] = s_obj

    session.flush()
    print(f"Added {len(db_students.keys())} students")
    return db_students
