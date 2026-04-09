from .academics.router import router as academics_router
from .courses.router import router as courses_router
from .facilities.router import router as facilities_router
from .users.router import router as users_router
from .schedules.router import router as schedules_router
from .conversations.router import router as conversations_router
from .common.routers.setup import router as setup_router

api_routers = [
    academics_router,
    courses_router,
    facilities_router,
    users_router,
    schedules_router,
    conversations_router,
    setup_router,
]
