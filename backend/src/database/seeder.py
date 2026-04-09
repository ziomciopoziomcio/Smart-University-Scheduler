import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.users.models import Roles, Permissions, Users

logger = logging.getLogger(__name__)


def seed_roles_and_permissions(db: Session, role_mapping: dict) -> None:
    """
    Seed roles and permissions table
    :param db: Database session
    :param role_mapping: A dictionary mapping role names to a list of permission codes. Example:
        {
            "admin": ["create_user", "delete_user", "update_user"],
            "user": ["view_user"]
        }
    :return: None
    """
    unique_perm_codes = set()
    for perms in role_mapping.values():
        unique_perm_codes.update(perms)

    db_permissions = {}
    for code in unique_perm_codes:
        result = db.execute(select(Permissions).where(Permissions.code == code))
        perm = result.scalars().first()
        if not perm:
            group_name = code.split(":")[0] if ":" in code else "general"

            perm = Permissions(
                code=code,
                name=code.replace("_", " ").replace(":", " ").title(),
                group=group_name,
                description=f"Allows {code.split(':')[-1]} on {group_name}",
            )
            db.add(perm)
        db_permissions[code] = perm

    db.flush()

    for role_name, perm_codes in role_mapping.items():
        result = db.execute(select(Roles).where(Roles.role_name == role_name))
        role = result.scalars().first()

        if not role:
            role = Roles(role_name=role_name)
            db.add(role)
        role.permissions = [
            db_permissions[code] for code in perm_codes if code in db_permissions
        ]
    db.flush()
    logger.info("Successfully seeded roles and permissions")


def create_admin_user(db: Session, admin_data: dict, hashed_password: str) -> Users:
    """
    Creates an admin user with the provided data and hashed password. The admin user will be assigned the "admin" role.
    :param db: Database session
    :param admin_data: A dictionary containing the admin user's data.
    :param hashed_password: The hashed password for the admin user.
    :return: The created admin user instance.
    """
    result = db.execute(select(Roles).where(Roles.role_name == "Administrator"))
    admin_role = result.scalars().first()

    if not admin_role:
        logger.error(
            "Administrator role not found. Please seed roles and permissions first."
        )
        raise ValueError("Administrator role not found.")

    new_admin = Users(
        email=admin_data["email"],
        password_hash=hashed_password,
        name=admin_data["name"],
        surname=admin_data["surname"],
        email_verified=True,
        two_factor_enabled=False,
    )

    new_admin.roles.append(admin_role)

    db.add(new_admin)
    db.flush()
    db.refresh(new_admin)

    logger.info("Successfully created admin user")
    return new_admin
