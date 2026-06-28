import json
import os
import secrets

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session
from starlette import status

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
from src.database.database import get_db
from src.database import seeder
from src.users.models import Users
from src.users.auth import hash_password as get_password_hash
from .schemas import SetupPayloadSchema, SeedPayloadSchema
from src.settings import models as settings_models
from src.academics.models import SemesterType as AcademicsSemesterType

ROOMS_PATH = "helpers/db_seeder/data/rooms.json"
GROUPS_PATH = "helpers/db_seeder/data/groups.json"
PERMS_EXCEL_PATH = "helpers/db_seeder/data/role_uprawnienia.xlsx"
PATH = "helpers/data_collector/final-programy.json"
PERMS_EXCEL_SHEET = "Arkusz1"
SEED = 1234

router = APIRouter(prefix="/setup", tags=["System Setup"])


def _parse_academics_semester_type(value):
    """
    Parses a value into AcademicsSemesterType accepting:
      - an instance of AcademicsSemesterType (returns it),
      - an enum member name (e.g. "WINTER" / "winter"),
      - an enum member value (e.g. "Winter" / "winter").
    Raises ValueError if parsing fails.
    """

    if isinstance(value, AcademicsSemesterType):
        return value
    if not isinstance(value, str):
        raise ValueError(
            "planned_semester_type must be a string or AcademicsSemesterType"
        )

    v = value.strip().lower()
    for m in AcademicsSemesterType:
        if m.name.lower() == v:
            return m
    for m in AcademicsSemesterType:
        if str(m.value).lower() == v:
            return m

    raise ValueError(f"Unknown AcademicsSemesterType: {value!r}")


@router.post("/")
def initialize_system(
    payload: SetupPayloadSchema,
    db: Session = Depends(get_db),
    x_setup_token: str = Header(..., description="Token required to run setup"),
):
    expected_token = os.getenv("SETUP_SECURITY_TOKEN")
    if not expected_token:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Missing Setup Token",
        )

    if not secrets.compare_digest(expected_token, x_setup_token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Setup Token"
        )

    user_exist = db.execute(select(Users.id).limit(1))
    if user_exist.scalars().first():
        raise HTTPException(status_code=400, detail="System already initialized")

    json_path = os.path.join(
        os.path.dirname(__file__), "../../database/seed_data/role_mapping.json"
    )
    with open(json_path, "r", encoding="utf-8") as f:
        role_mapping = json.load(f)

    if payload.custom_role_mapping:
        role_mapping = payload.custom_role_mapping

    try:
        seeder.seed_roles_and_permissions(db, role_mapping)
        hashed_pwd = get_password_hash(payload.admin_password)
        admin_data = {
            "email": payload.admin_email,
            "name": payload.admin_name,
            "surname": payload.admin_surname,
        }
        seeder.create_admin_user(db, admin_data, hashed_pwd)

        if payload.planner_settings:
            ps = payload.planner_settings
            ps_data = ps.model_dump(exclude_unset=True, exclude_none=True)
            if (
                "planned_semester_type" in ps_data
                and ps_data["planned_semester_type"] is not None
            ):
                try:
                    ps_data["planned_semester_type"] = _parse_academics_semester_type(
                        ps_data["planned_semester_type"]
                    )
                except ValueError:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid planned_semester_type: {ps_data.get('planned_semester_type')}",
                    )

            faculty_id = ps_data.get("faculty_id")
            if faculty_id is not None:
                existing_settings = (
                    db.execute(
                        select(settings_models.PlannerSettings.id).where(
                            settings_models.PlannerSettings.faculty_id == faculty_id
                        )
                    )
                    .scalars()
                    .first()
                )
                if existing_settings:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Planner settings already exist for faculty_id {faculty_id}.",
                    )

            settings_obj = settings_models.PlannerSettings(**ps_data)
            db.add(settings_obj)

        db.commit()
    except IntegrityError as exc:
        db.rollback()
        error_message = str(getattr(exc, "orig", exc)).lower()
        if "foreign key" in error_message and "faculty" in error_message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid faculty_id: referenced faculty does not exist.",
            )

        if ("unique" in error_message or "duplicate" in error_message) and (
            "planner_settings" in error_message or "faculty" in error_message
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Planner settings already exist for the provided faculty_id.",
            )
        raise HTTPException(status_code=409, detail="Database conflict.")
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error.")
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

    return {"message": "System initialized successfully."}


@router.post("/seed")
async def seed_system(
    payload: SeedPayloadSchema,
    session: Session = Depends(get_db),
    x_seed_token: str = Header(..., alias="X-Seed-Token"),
):
    # token validation
    expected_token = os.getenv("SEED_SECURITY_TOKEN")

    if not expected_token:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Missing seed token")

    if not secrets.compare_digest(expected_token, x_seed_token):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Invalid seed token")

    # SEED ALWAYS
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

    if payload.seed_test_db:
        # CALENDAR
        generate_academic_calendar(session=session)
        session.commit()

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
        generate_rooms(session, ROOMS_PATH, db_faculties, db_units, db_buildings)
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
            password_hash_func=PASSWORD_HASH_FUNC,
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
        generate_course_type_details(session, db_courses, PATH)
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
            session=session,
            db_study_programs=db_study_programs,
            sourcefile=GROUPS_PATH,
            db_study_fields=db_study_fields,
        )
        session.commit()

        db_major_groups = generate_major_groups(
            sourcefile=GROUPS_PATH,
            session=session,
            db_study_programs=db_study_programs,
            db_majors=db_majors,
            db_curr_courses=db_curr_courses,
            db_study_fields=db_study_fields,
        )
        session.commit()

        db_elective_groups = generate_elective_groups(
            session=session,
            sourcefile=GROUPS_PATH,
            db_study_programs=db_study_programs,
            db_elective_blocks=db_elective_blocks,
            db_curr_courses=db_elective_curr_courses,
            db_study_fields=db_study_fields,
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
        generate_course_instructors(
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
        _, _ = create_user_admin(
            session=session,
            password_hash_func=PASSWORD_HASH_FUNC,
            roles=db_roles,
            db_faculties=db_faculties,
            db_units=db_units,
            name=payload.admin_name,
            surname=payload.admin_surname,
            email=payload.admin_email,
            phone_number=payload.admin_phone,
            password=payload.admin_password,
        )
        session.commit()

    else:
        # seed is false
        # ADMIN
        _, _ = create_user_admin(
            session=session,
            password_hash_func=PASSWORD_HASH_FUNC,
            roles=db_roles,
            db_faculties=None,
            db_units=None,
            name=payload.admin_name,
            surname=payload.admin_surname,
            email=payload.admin_email,
            phone_number=payload.admin_phone,
            password=payload.admin_password,
        )
        session.commit()

    return {"message": "success"}
