from fastapi import Depends, HTTPException, status

from src.users import models
from src.users.auth import get_current_user


def require_permission(permission_code: str):
    """
    Create a FastAPI dependency that ensures the current user has a specific permission.
    """

    def dependency(
        current_user: models.Users = Depends(get_current_user),
    ):
        user_permissions = set()
        for role in current_user.roles:
            for perm in role.permissions:
                user_permissions.add(perm.code)

        if permission_code not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions"
            )
        return current_user

    return dependency
