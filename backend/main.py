import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src import api_routers
from src.users.auth import get_secret_key

load_dotenv()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    get_secret_key()
    yield


app = FastAPI(
    title="Smart University Scheduler API",
    description="API for managing SUS system",
    version="v.0.0.1-alpha",
    lifespan=lifespan,
)


origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    allow_credentials=True,
)

for router in api_routers:
    app.include_router(router)


@app.get("/")
async def test():
    return {"status": "SUS API is running!"}
