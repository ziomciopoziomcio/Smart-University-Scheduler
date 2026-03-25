import asyncio
import json
import os
import logging
from aiokafka import AIOKafkaConsumer

from data_provider import DataProvider
from neo4j_provider import Neo4jProvider

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def process_task(
    task_data: dict, data_prov: DataProvider, neo4j_prov: Neo4jProvider
) -> None:
    """
    Task handler for schedule optimization requests.

    :param task_data: Dictionary with task data. Expected keys:
        - task_id (str | int, required): Unique identifier of the task/message.
        - faculty_id (str | int, required): Identifier of the faculty for which
          data should be fetched and the schedule optimized.
        - academic_year (str | int, optional): Academic year context for the
          optimization (e.g. "2024/2025" or 2024).
        - additional fields (dict, optional): Backend-specific parameters that
          may be present but are not used directly by this worker.
    :param data_prov: DataProvider object used to retrieve all required data.
    :param neo4j_prov: Neo4jProvider object.
    :return: None
    """
    try:
        faculty_id = task_data.get("faculty_id")
        if not faculty_id:
            logger.error("Faculty id not provided")
            return

        data = await asyncio.to_thread(data_prov.get_all_data, faculty_id)
        await neo4j_prov.initialize_base_graph()

        await neo4j_prov.load_infrastructure(data["rooms"])
        await neo4j_prov.load_instructors(data["employees"])
        await neo4j_prov.load_requirements(data["requirements"])
        await neo4j_prov.load_competencies(data["competencies"])

        # await run_ai_optimizer(faculty_id) TODO

    except Exception as e:
        logger.exception(f"Critical error: {e}")


async def main() -> None:
    """
    Main function
    :return: None
    """
    kafka_url = os.getenv("KAFKA_URL", "kafka:29092")
    consumer = AIOKafkaConsumer(
        "schedule.optimization.requests",
        bootstrap_servers=kafka_url,
        group_id="smart_scheduler_ai_group",
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
        auto_offset_reset="earliest",
    )

    data_provider = DataProvider()
    neo4j_provider = Neo4jProvider()

    connected = False
    while not connected:
        try:
            await consumer.start()
            connected = True
        except Exception as e:
            logger.error(f"Failed to connect to Kafka: {e}")
            await asyncio.sleep(5)

    try:
        async for msg in consumer:
            await process_task(msg.value, data_provider, neo4j_provider)
    finally:
        await consumer.stop()
        await neo4j_provider.close()


if __name__ == "__main__":
    asyncio.run(main())
