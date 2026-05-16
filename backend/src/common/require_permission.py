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
        if not user_has_permission(current_user, permission_code):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions"
            )
        return current_user

    return dependency


def user_has_permission(user: models.Users, permission_code: str) -> bool:
    return any(
        perm.code == permission_code for role in user.roles for perm in role.permissions
    )
