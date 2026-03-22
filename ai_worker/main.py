import asyncio
import json
import os
import logging
from aiokafka import AIOKafkaConsumer
from data_provider import DataProvider

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def process_task(task_data: dict):
    faculty_id = task_data.get("faculty_id")
    if not faculty_id:
        logger.error("Faculty id not provided")
        return

    provider = DataProvider()

    data = await asyncio.to_thread(provider.get_all_data, faculty_id)  # noqa: F841


async def main():
    kafka_url = os.getenv("KAFKA_URL")
    consumer = AIOKafkaConsumer(
        "schedule.optimization.requests",
        bootstrap_servers=kafka_url,
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    )

    await consumer.start()

    try:
        async for msg in consumer:
            asyncio.create_task(process_task(msg.value))
    finally:
        await consumer.stop()


if __name__ == "__main__":
    asyncio.run(main())
