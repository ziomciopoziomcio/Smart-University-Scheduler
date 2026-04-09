import json
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.users.auth import get_db
from src.database import seeder
from src.users.models import Users
from src.users.auth import hash_password as get_password_hash
from .schemas import SetupPayloadSchema  # todo

router = APIRouter(prefix="/setup", tags=["System Setup"])


@router.post("/")
async def initialize_system(
    payload: SetupPayloadSchema, db: AsyncSession = Depends(get_db)
):
    user_exist = await db.execute(select(Users.id).limit(1))
    if user_exist.scalars().first():
        raise HTTPException(status_code=400, detail="System already initialized")

    json_path = os.path.join(
        os.path.dirname(__file__), "../../database/seed_data/role_mapping.json"
    )
    with open(json_path, "r", encoding="utf-8") as f:
        role_mapping = json.load(f)

    if payload.custom_role_mapping:
        role_mapping = payload.custom_role_mapping

    await seeder.seed_roles_and_permissions(db, role_mapping)
    hashed_pwd = get_password_hash(payload.admin_password)
    admin_data = {
        "email": payload.admin_email,
        "name": payload.admin_name,
        "surname": payload.admin_surname,
    }
    await seeder.create_admin_user(db, admin_data, hashed_pwd)
    return {"message": "Admin user created successfully"}
