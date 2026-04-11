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

router = APIRouter(prefix="/setup", tags=["System Setup"])


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
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Database conflict.")
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error.")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

    return {"message": "System initialized successfully."}
