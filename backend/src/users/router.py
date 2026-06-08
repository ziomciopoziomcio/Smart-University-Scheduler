from fastapi import APIRouter

from .routers.auth import router as auth_router
from .routers.permissions import router as permissions_router
from .routers.roles import router as roles_router
from .routers.users import router as users_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(permissions_router)
router.include_router(roles_router)
router.include_router(users_router)
