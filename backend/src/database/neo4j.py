import logging
import os

from neo4j import AsyncGraphDatabase

logger = logging.getLogger(__name__)

URI = f"bolt://{os.getenv('NEO4J_HOST', 'neo4j')}:{os.getenv('NEO4J_PORT', '7687')}"
USER = os.getenv("NEO4J_USER", "neo4j")
PASSWORD = os.getenv("NEO4J_PASSWORD")

if not PASSWORD:
    raise RuntimeError("NEO4J_PASSWORD environment variable must be set.")
try:
    neo4j_driver = AsyncGraphDatabase.driver(URI, auth=(USER, PASSWORD))
    logger.info("Backend successfully connected to Neo4j")
except Exception as e:
    logger.error(f"Failed to connect to Neo4j: {e}")
    neo4j_driver = None


async def get_neo4j_session():
    if not neo4j_driver:
        raise RuntimeError(
            "Neo4j driver is not initialized. Check logs for connection errors."
        )
    async with neo4j_driver.session() as session:
        yield session


async def check_availability_in_neo4j(
    session_id: str, new_timeslot_id: int, neo4j_session
) -> str:
    """
    Checks if the proposed timeslot for a class session causes any conflicts with other sessions for the same group.
    :param session_id: Session id
    :param new_timeslot_id: Proposed new timeslot id
    :param neo4j_session: Neo4j session
    :return: A string message indicating whether there are conflicts or not, and if there are, details about the conflicts.
    """
    human_conflict_query = """
        MATCH (target_s:ClassSession {sessionId: $session_id})

        OPTIONAL MATCH (target_s)-[:TAUGHT_BY]->(i:Instructor)
        OPTIONAL MATCH (target_s)-[:FOR_GROUP]->(g:Group)

        OPTIONAL MATCH (other_s:ClassSession)-[:AT_TIME]->(t:TimeSlot {timeSlotId: $new_timeslot_id})
        WHERE other_s <> target_s AND (
            (other_s)-[:TAUGHT_BY]->(i) OR
            (other_s)-[:FOR_GROUP]->(g)
        )

        RETURN other_s.sessionId IS NOT NULL AS has_conflict
        LIMIT 1
        """

    human_result = await neo4j_session.run(
        human_conflict_query, session_id=session_id, new_timeslot_id=new_timeslot_id
    )
    human_record = await human_result.single()

    if human_record and human_record["has_conflict"]:
        return "STATUS: CONFLICT. Either the instructor or the student group has another class at this time. Propose a DIFFERENT time."

    free_rooms_query = """
        MATCH (s:ClassSession {sessionId: $session_id})
        MATCH (s)-[:OF_COURSE]->(c:Course)
        MATCH (s)-[:FOR_GROUP]->(g:Group)
        WITH c.pcNeeded AS pc, c.projectorNeeded AS proj, g.membersAmount AS capacity

        MATCH (r:Room)
        WHERE r.roomCapacity >= capacity
          AND (pc = false OR r.pcAmount > 0)
          AND (proj = false OR r.projectorAvailability = true)

        OPTIONAL MATCH (r)<-[:HELD_IN]-(other_s:ClassSession)-[:AT_TIME]->(t:TimeSlot {timeSlotId: $new_timeslot_id})
        WITH r, other_s
        WHERE other_s IS NULL

        RETURN r.roomId AS room_id, r.roomName AS room_name
        LIMIT 3
        """

    rooms_result = await neo4j_session.run(
        free_rooms_query, session_id=session_id, new_timeslot_id=new_timeslot_id
    )
    free_rooms = await rooms_result.data()

    if not free_rooms:
        return "STATUS: NO ROOMS. The groups are free, but there are no available rooms with proper capacity/equipment at this time. Propose a DIFFERENT time."

    room_options = ", ".join(
        [f"Room ID: {r['room_id']} (Name: {r['room_name']})" for r in free_rooms]
    )

    return f"STATUS: OK. Time is free. Available rooms: {room_options}. You MUST use one of these Room IDs when calling create_reschedule_suggestion."
