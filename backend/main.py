from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src import api_routers

app = FastAPI(
    title="Smart University Scheduler API",
    description="API for managing SUS system",
    version="v.0.0.1-alpha",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

for router in api_routers:
    app.include_router(router)


@app.get("/")
async def test():
    return {"status": "SUS API is running!"}
