from pathlib import Path

from helpers.db_seeder.generators._save_users_to_excel import (
    save_teachers_to_excel,
    save_not_teachers_to_excel,
)
from helpers.db_seeder.generators.create_admin import create_user_admin

# import src.academics.models
# import src.users.models
# import src.facilities.models

from helpers.db_seeder.generators.groups import (
    generate_common_groups,
    assign_students_to_common_groups,
    generate_major_groups,
    assign_students_to_major_groups,
    generate_elective_groups,
    assign_students_to_elective_groups,
)
from helpers.db_seeder.generators.students import generate_students
from src.database.base import Base
from src.database.database import get_db, engine

from helpers.db_seeder.generators.academics import generate_units
from helpers.db_seeder.generators.course_instructors import (
    extract_teachers,
    generate_course_instructors,
)
from helpers.db_seeder.generators.courses import (
    generate_study_fields,
    generate_majors,
    generate_courses,
    generate_course_type_details,
    generate_elective_blocks,
)
from helpers.db_seeder.generators.curriculum_courses import (
    generate_curriculum_courses,
    generate_curriculum_courses_elective_blocks,
)
from helpers.db_seeder.generators.employees import generate_employees
from helpers.db_seeder.generators.facilities import (
    generate_faculties,
    generate_campuses,
    generate_rooms,
    generate_buildings,
)
from helpers.db_seeder.generators.roles_perms import (
    generate_permissions_from_excel_file,
    generate_roles_from_excel_file,
)
from helpers.db_seeder.generators.study_programs import generate_study_programs
from helpers.db_seeder.generators.users import generate_users

BASE_DIR = Path(__file__).resolve().parent

ROOMS_PATH = str((BASE_DIR / ".." / "data" / "rooms.json").resolve())
PATH = str(
    (
        BASE_DIR
        / ".."
        / ".."
        / ".."
        / "helpers"
        / "data_collector"
        / "final-programy.json"
    ).resolve()
)

PERMS_EXCEL_PATH = r"..\data\role_uprawnienia.xlsx"
GROUPS_PATH = r"..\data\groups.json"
PERMS_EXCEL_SHEET = "Arkusz1"
SEED = 1234

EXCEL_WITH_TEACHERS = "../excel_users/teachers.xlsx"
EXCEL_WITH_OTHER_USERS = "../excel_users/other_users.xlsx"

if __name__ == "__main__":
    # Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    session = next(get_db())

    # CAMPUSES
    db_campuses = generate_campuses(session)
    session.commit()

    # FACULTIES
    db_faculties = generate_faculties(session)
    session.commit()

    # BUILDINGS
    db_buildings = generate_buildings(session, db_campuses)
    session.commit()

    # UNITS
    db_units = generate_units(session, db_faculties)
    session.commit()

    # ROOMS
    db_rooms = generate_rooms(session, ROOMS_PATH, db_faculties, db_units, db_buildings)
    session.commit()

    # STUDY FIELDS
    db_study_fields = generate_study_fields(session, db_faculties, PATH)
    session.commit()

    # STUDY PROGRAMS
    db_study_programs = generate_study_programs(session, PATH, db_study_fields)
    session.commit()

    # MAJORS
    db_majors = generate_majors(session, db_study_fields, PATH)
    session.commit()

    # ELECTIVE BLOCKS
    db_elective_blocks = generate_elective_blocks(session, db_study_fields)
    session.commit()

    # PERMISSIONS
    db_permissions = generate_permissions_from_excel_file(
        session,
        PERMS_EXCEL_PATH,
        PERMS_EXCEL_SHEET,
    )
    session.commit()

    # ROLES
    db_roles = generate_roles_from_excel_file(
        session,
        PERMS_EXCEL_PATH,
        PERMS_EXCEL_SHEET,
        db_permissions,
    )
    session.commit()

    # USERS
    num_of_roles_not_teachers = {
        "Administrator": 0,
        "Schedule Manager": 0,
        "Dean's Office": 0,
        "Head of Unit": 0,
        "Instructor": 0,
        "Student": 1500,
        "Administrative Staff": 0,
        "Guest": 0,
    }
    teachers = extract_teachers(PATH)
    db_teachers, db_not_teachers = generate_users(
        session=session,
        roles=db_roles,
        total_not_teacher_new_users=1500,
        num_of_roles_not_teachers=num_of_roles_not_teachers,
        teachers=teachers,
        seed=SEED,
        not_teacher_email_domain="edu.p.lodz.pl",
        teacher_email_domain="p.lodz.pl",
        password_hash_func=None,
    )
    session.commit()

    # EMPLOYEES
    db_employees = generate_employees(
        session=session,
        db_teachers=db_teachers,
        db_units=db_units,
        db_faculties=db_faculties,
    )
    session.commit()

    # COURSES
    db_courses = generate_courses(session, db_units, db_employees, PATH)
    session.commit()

    # COURSES TYPE DETAILS
    db_course_details = generate_course_type_details(session, db_courses, PATH)
    session.commit()

    # CURRICULUM COURSES
    db_curr_courses = generate_curriculum_courses(
        sourcefile=PATH,
        session=session,
        db_study_programs=db_study_programs,
        db_courses=db_courses,
        db_majors=db_majors,
    )
    session.commit()

    # CURRICULUM COURSES FOR ELECTIVE BLOCKS
    db_elective_curr_courses = generate_curriculum_courses_elective_blocks(
        sourcefile=PATH,
        session=session,
        db_study_programs=db_study_programs,
        db_courses=db_courses,
        db_elective_blocks=db_elective_blocks,
        limit=3,
        seed=SEED,
    )
    session.commit()

    # GROUPS
    db_common_groups = generate_common_groups(
        session=session, db_study_programs=db_study_programs, sourcefile=GROUPS_PATH
    )
    session.commit()

    db_major_groups = generate_major_groups(
        sourcefile=GROUPS_PATH,
        session=session,
        db_study_programs=db_study_programs,
        db_majors=db_majors,
        db_curr_courses=db_curr_courses,
    )
    session.commit()

    db_elective_groups = generate_elective_groups(
        session=session,
        sourcefile=GROUPS_PATH,
        db_study_programs=db_study_programs,
        db_elective_blocks=db_elective_blocks,
        db_curr_courses=db_elective_curr_courses,
    )
    session.commit()

    # STUDENTS
    db_students = generate_students(
        session=session,
        db_not_teachers=db_not_teachers,
        db_study_programs=db_study_programs,
        db_majors=db_majors,
        db_major_groups=db_major_groups,
    )
    session.commit()

    # GROUP MEMBERS
    assign_students_to_common_groups(
        session=session,
        db_common_groups=db_common_groups,
        db_students=db_students,
        db_study_programs=db_study_programs,
        group_size=15,
    )
    session.commit()

    assign_students_to_major_groups(
        session=session,
        db_major_groups=db_major_groups,
        db_students=db_students,
        db_study_programs=db_study_programs,
        db_curr_courses=db_curr_courses,
    )
    session.commit()

    assign_students_to_elective_groups(
        session=session,
        db_elective_groups=db_elective_groups,
        db_students=db_students,
        db_study_programs=db_study_programs,
    )
    session.commit()

    # COURSE INSTRUCTORS
    db_course_instructors = generate_course_instructors(
        session=session,
        sourcefile=PATH,
        num_of_groups=5,
        db_teachers=db_teachers,
        db_courses=db_courses,
        db_employees=db_employees,
        debug=False,
    )
    session.commit()

    # ADMIN
    admin_obj = create_user_admin(
        session=session, password_hash_func=None, roles=db_roles
    )
    session.commit()

    # SAVE USERS TO EXCEL
    save_teachers_to_excel(
        filename=EXCEL_WITH_TEACHERS,
        db_teachers=db_teachers,
        db_faculties=db_faculties,
        db_units=db_units,
        db_employees=db_employees,
    )

    save_not_teachers_to_excel(
        filename=EXCEL_WITH_OTHER_USERS, db_not_teachers=db_not_teachers
    )

    session.close()
