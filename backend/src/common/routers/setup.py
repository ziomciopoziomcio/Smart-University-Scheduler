import json
import os
import secrets

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session
from starlette import status

from src.database.database import get_db
from src.database import seeder
from src.users.models import Users
from src.users.auth import hash_password as get_password_hash
from .schemas import SetupPayloadSchema
from src.settings import models as settings_models
from src.academics.models import SemesterType as AcademicsSemesterType

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
