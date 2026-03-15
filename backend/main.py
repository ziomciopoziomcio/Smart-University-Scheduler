import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src import api_routers

load_dotenv()

app = FastAPI(
    title="Smart University Scheduler API",
    description="API for managing SUS system",
    version="v.0.0.1-alpha",
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
