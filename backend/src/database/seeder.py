import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.users.models import Roles, Permissions

logger = logging.getLogger(__name__)


async def seed_roles_and_permissions(db: AsyncSession, role_mapping: dict) -> None:
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
        result = await db.execute(select(Permissions).where(Permissions.code == code))
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

    await db.flush()

    for role_name, perm_codes in role_mapping.items():
        result = await db.execute(select(Roles).where(Roles.role_name == role_name))
        role = result.scalars().first()

        if not role:
            role = Roles(role_name=role_name)
            db.add(role)
        role.permissions = [
            db_permissions[code] for code in perm_codes if code in db_permissions
        ]
    await db.commit()
    logger.info("Successfully seed roles and permissions")
