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
        has_permission = any(
            perm.code == permission_code
            for role in current_user.roles
            for perm in role.permissions
        )

        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions"
            )
        return current_user

    return dependency
