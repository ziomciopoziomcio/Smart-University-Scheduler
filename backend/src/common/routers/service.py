from sqlalchemy.orm import Session

from .schemas import SeedPayloadSchema

from helpers.db_seeder.generators._db_seeder import PASSWORD_HASH_FUNC
from helpers.db_seeder.generators.academic_calendar import generate_academic_calendar
from helpers.db_seeder.generators.academics import generate_units
from helpers.db_seeder.generators.course_instructors import (
    extract_teachers,
    generate_course_instructors,
)
from helpers.db_seeder.generators.courses import (
    generate_study_fields,
    generate_majors,
    generate_elective_blocks,
    generate_courses,
    generate_course_type_details,
)
from helpers.db_seeder.generators.create_admin import create_user_admin
from helpers.db_seeder.generators.curriculum_courses import (
    generate_curriculum_courses,
    generate_curriculum_courses_elective_blocks,
)
from helpers.db_seeder.generators.employees import generate_employees
from helpers.db_seeder.generators.facilities import (
    generate_campuses,
    generate_faculties,
    generate_buildings,
    generate_rooms,
)
from helpers.db_seeder.generators.groups import (
    generate_common_groups,
    generate_major_groups,
    generate_elective_groups,
    assign_students_to_common_groups,
    assign_students_to_major_groups,
    assign_students_to_elective_groups,
)
from helpers.db_seeder.generators.roles_perms import (
    generate_permissions_from_excel_file,
    generate_roles_from_excel_file,
)
from helpers.db_seeder.generators.students import generate_students
from helpers.db_seeder.generators.study_programs import generate_study_programs
from helpers.db_seeder.generators.users import generate_users

ROOMS_PATH = "helpers/db_seeder/data/rooms.json"
GROUPS_PATH = "helpers/db_seeder/data/groups.json"
PERMS_EXCEL_PATH = "helpers/db_seeder/data/role_uprawnienia.xlsx"
PATH = "helpers/data_collector/final-programy.json"
PERMS_EXCEL_SHEET = "Arkusz1"
SEED = 1234


class SeederService:

    def __init__(self, session: Session):
        self.session = session

        self.db_roles = None
        self.db_permissions = None

    async def seed(self, payload: SeedPayloadSchema):
        self.seed_permissions()
        self.seed_roles()

        if payload.seed_test_db:
            self.seed_test_database(payload)
        else:
            self.create_admin(payload)

    def seed_permissions(self):
        self.db_permissions = generate_permissions_from_excel_file(
            self.session,
            PERMS_EXCEL_PATH,
            PERMS_EXCEL_SHEET,
        )
        self.session.commit()

    def seed_roles(self):
        self.db_roles = generate_roles_from_excel_file(
            self.session,
            PERMS_EXCEL_PATH,
            PERMS_EXCEL_SHEET,
            self.db_permissions,
        )
        self.session.commit()

    def create_admin(self, payload: SeedPayloadSchema):
        create_user_admin(
            session=self.session,
            password_hash_func=PASSWORD_HASH_FUNC,
            roles=self.db_roles,
            db_faculties=None,
            db_units=None,
            name=payload.admin_name,
            surname=payload.admin_surname,
            email=payload.admin_email,
            phone_number=payload.admin_phone,
            password=payload.admin_password,
        )
        self.session.commit()

    def seed_test_database(self, payload: SeedPayloadSchema):
        # CALENDAR
        generate_academic_calendar(session=self.session)
        self.session.commit()

        # CAMPUSES
        db_campuses = generate_campuses(self.session)
        self.session.commit()

        # FACULTIES
        db_faculties = generate_faculties(self.session)
        self.session.commit()

        # BUILDINGS
        db_buildings = generate_buildings(self.session, db_campuses)
        self.session.commit()

        # UNITS
        db_units = generate_units(self.session, db_faculties)
        self.session.commit()

        # ROOMS
        generate_rooms(self.session, ROOMS_PATH, db_faculties, db_units, db_buildings)
        self.session.commit()

        # STUDY FIELDS
        db_study_fields = generate_study_fields(self.session, db_faculties, PATH)
        self.session.commit()

        # STUDY PROGRAMS
        db_study_programs = generate_study_programs(self.session, PATH, db_study_fields)
        self.session.commit()

        # MAJORS
        db_majors = generate_majors(self.session, db_study_fields, PATH)
        self.session.commit()

        # ELECTIVE BLOCKS
        db_elective_blocks = generate_elective_blocks(self.session, db_study_fields)
        self.session.commit()

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
            session=self.session,
            roles=self.db_roles,
            total_not_teacher_new_users=1500,
            num_of_roles_not_teachers=num_of_roles_not_teachers,
            teachers=teachers,
            seed=SEED,
            not_teacher_email_domain="edu.p.lodz.pl",
            teacher_email_domain="p.lodz.pl",
            password_hash_func=PASSWORD_HASH_FUNC,
        )
        self.session.commit()

        # EMPLOYEES
        db_employees = generate_employees(
            session=self.session,
            db_teachers=db_teachers,
            db_units=db_units,
            db_faculties=db_faculties,
        )
        self.session.commit()

        # COURSES
        db_courses = generate_courses(self.session, db_units, db_employees, PATH)
        self.session.commit()

        # COURSES TYPE DETAILS
        generate_course_type_details(self.session, db_courses, PATH)
        self.session.commit()

        # CURRICULUM COURSES
        db_curr_courses = generate_curriculum_courses(
            sourcefile=PATH,
            session=self.session,
            db_study_programs=db_study_programs,
            db_courses=db_courses,
            db_majors=db_majors,
        )
        self.session.commit()

        # CURRICULUM COURSES FOR ELECTIVE BLOCKS
        db_elective_curr_courses = generate_curriculum_courses_elective_blocks(
            sourcefile=PATH,
            session=self.session,
            db_study_programs=db_study_programs,
            db_courses=db_courses,
            db_elective_blocks=db_elective_blocks,
            limit=3,
            seed=SEED,
        )
        self.session.commit()

        # GROUPS
        db_common_groups = generate_common_groups(
            session=self.session,
            db_study_programs=db_study_programs,
            sourcefile=GROUPS_PATH,
            db_study_fields=db_study_fields,
        )
        self.session.commit()

        db_major_groups = generate_major_groups(
            sourcefile=GROUPS_PATH,
            session=self.session,
            db_study_programs=db_study_programs,
            db_majors=db_majors,
            db_curr_courses=db_curr_courses,
            db_study_fields=db_study_fields,
        )
        self.session.commit()

        db_elective_groups = generate_elective_groups(
            session=self.session,
            sourcefile=GROUPS_PATH,
            db_study_programs=db_study_programs,
            db_elective_blocks=db_elective_blocks,
            db_curr_courses=db_elective_curr_courses,
            db_study_fields=db_study_fields,
        )
        self.session.commit()

        # STUDENTS
        db_students = generate_students(
            session=self.session,
            db_not_teachers=db_not_teachers,
            db_study_programs=db_study_programs,
            db_majors=db_majors,
            db_major_groups=db_major_groups,
        )
        self.session.commit()

        # GROUP MEMBERS
        assign_students_to_common_groups(
            session=self.session,
            db_common_groups=db_common_groups,
            db_students=db_students,
            db_study_programs=db_study_programs,
            group_size=15,
        )
        self.session.commit()

        assign_students_to_major_groups(
            session=self.session,
            db_major_groups=db_major_groups,
            db_students=db_students,
            db_study_programs=db_study_programs,
            db_curr_courses=db_curr_courses,
        )
        self.session.commit()

        assign_students_to_elective_groups(
            session=self.session,
            db_elective_groups=db_elective_groups,
            db_students=db_students,
            db_study_programs=db_study_programs,
        )
        self.session.commit()

        # COURSE INSTRUCTORS
        generate_course_instructors(
            session=self.session,
            sourcefile=PATH,
            num_of_groups=5,
            db_teachers=db_teachers,
            db_courses=db_courses,
            db_employees=db_employees,
            debug=False,
        )
        self.session.commit()

        # ADMIN
        create_user_admin(
            session=self.session,
            password_hash_func=PASSWORD_HASH_FUNC,
            roles=self.db_roles,
            db_faculties=db_faculties,
            db_units=db_units,
            name=payload.admin_name,
            surname=payload.admin_surname,
            email=payload.admin_email,
            phone_number=payload.admin_phone,
            password=payload.admin_password,
        )
        self.session.commit()
