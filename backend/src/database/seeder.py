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
    unique_perm_codes = {code for perms in role_mapping.values() for code in perms}
    existing_perms_result = db.execute(
        select(Permissions).where(Permissions.code.in_(unique_perm_codes))
    )
    db_permissions = {p.code: p for p in existing_perms_result.scalars().all()}

    new_perms = []
    for code in unique_perm_codes:
        if code not in db_permissions:
            group_name = code.split(":")[0] if ":" in code else "general"
            new_perm = Permissions(
                code=code,
                name=code.replace("-", " ").replace(":", " ").title(),
                group=group_name,
                description=f"Allows {code.split(':')[-1]} on {group_name}",
            )
            new_perms.append(new_perm)

    if new_perms:
        db.add_all(new_perms)
        db.flush()
        for p in new_perms:
            db_permissions[p.code] = p

    role_names = list(role_mapping.keys())
    existing_roles_result = db.execute(
        select(Roles).where(Roles.role_name.in_(role_names))
    )
    db_roles = {r.role_name for r in existing_roles_result.scalars().all()}

    new_roles = []
    for role_name, perm_codes in role_mapping.items():
        role = db_roles.get(role_name)

        if not role:
            role = Roles(role_name=role_name)
            new_roles.append(role)
            db_roles[role_name] = role
        role.permissions = [
            db_permissions[code] for code in perm_codes if code in db_permissions
        ]

    if new_roles:
        db.add_all(new_roles)

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
