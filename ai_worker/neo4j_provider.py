import logging
import os

from neo4j import AsyncGraphDatabase, Query

logger = logging.getLogger(__name__)


class Neo4jProvider:
    """Neo4j Provider"""

    def __init__(self):
        uri = f"bolt://{os.getenv('NEO4J_HOST', 'neo4j')}:{os.getenv('NEO4J_PORT', '7687')}"
        user = os.getenv("NEO4J_USER", "neo4j")
        password = os.getenv("NEO4J_PASSWORD", "password")

        self.driver = AsyncGraphDatabase.driver(uri, auth=(user, password))

    async def close(self) -> None:
        """Close the driver"""
        await self.driver.close()

    async def initialize_base_graph(self) -> None:
        """
        Clear existing graphs and generate timeslots
        :return: None
        """

        clear_query = Query("MATCH (n) DETACH DELETE n")

        days_of_week = ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays"]
        schedule_data = []

        for day in days_of_week:
            slots = []
            for hour in range(8, 20):
                start_time = f"{hour:02d}:15"
                end_time = f"{hour+1:02d}:00"

                slots.append({"start": start_time, "end": end_time})
            schedule_data.append({"day": day, "slots": slots})

        query = Query(
            """
        UNWIND $schedule_data AS day_data
        WITH day_data.day AS dayOfWeek, day_data.slots AS slots

        UNWIND slots AS slot
        MERGE (t:TimeSlot {dayOfWeek: dayOfWeek, startTime: slot.start})
        SET t.endTime = slot.end

        WITH dayOfWeek, collect(t) AS day_slots

        UNWIND range(0, size(day_slots)-2) AS i
        WITH day_slots[i] AS current_slot, day_slots[i+1] AS next_slot
        MERGE (current_slot)-[:NEXT]->(next_slot)
        """
        )

        try:
            async with self.driver.session() as session:
                await session.run(clear_query)
                logger.info("Clear existing graph")

                await session.run(query, schedule_data=schedule_data)
        except Exception as e:
            logger.exception(f"Exception occurred during Graph DB init: {e}")

    async def save_class_session(self, session_data: dict) -> None:
        """
        Save a class session to the graph database
        :param session_data: A dictionary containing class session details
        :return: None
        """
        pass
