import asyncio
import os
from contextlib import asynccontextmanager

from aiokafka import AIOKafkaProducer
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src import api_routers
from src.common.kafka_client import kafka_manager

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    max_retries = 5
    for _ in range(max_retries):
        try:
            kafka_manager.producer = AIOKafkaProducer(
                bootstrap_servers=os.getenv("KAFKA_URL", "localhost:9092"),
            )
            await kafka_manager.producer.start()
            break
        except Exception as e:
            print(f"Error: {e}")
            await asyncio.sleep(5)
    yield

    try:
        if kafka_manager.producer:
            await kafka_manager.producer.stop()
    except Exception as e:
        print(f"Error during Kafka producer shutdown: {e}")


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
