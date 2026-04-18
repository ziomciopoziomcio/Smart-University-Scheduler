import logging
import os
from fastapi import HTTPException, status

from neo4j import AsyncGraphDatabase

logger = logging.getLogger(__name__)

_neo4j_driver: AsyncGraphDatabase | None = None


def _get_driver():
    """
    Lazy load the neo4j driver
    :return: The neo4j driver instance
    """
    global _neo4j_driver
    if _neo4j_driver is not None:
        return _neo4j_driver
    uri = f"bolt://{os.getenv('NEO4J_HOST', 'neo4j')}:{os.getenv('NEO4J_PORT', '7687')}"
    user = os.getenv("NEO4J_USER", "neo4j")
    password = os.getenv("NEO4J_PASSWORD")

    if not password:
        logger.error("Neo4j password not set")
        raise ValueError("Neo4j password not set")

    try:
        _neo4j_driver = AsyncGraphDatabase.driver(uri, auth=(user, password))
        logger.info("Backend successfully connected to Neo4j")
    except Exception as e:
        logger.error(f"Failed to connect to Neo4j: {e}")
        raise ValueError(f"Failed to connect to Neo4j: {e}")

    return _neo4j_driver


async def get_neo4j_session():
    try:
        driver = _get_driver()
    except ValueError as e:
        logger.error(f"Cannot provide Neo4j session: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Graph database is currently unavailable. Please try again later.",
        )

    async with driver.session() as session:
        yield session


async def close_neo4j_driver() -> None:
    """
    Gracefully close the neo4j driver
    :return: None
    """
    global _neo4j_driver
    if _neo4j_driver is not None:
        try:
            await _neo4j_driver.close()
            logger.info("Neo4j driver successfully closed.")
        except Exception as e:
            logger.error(f"Error while closing Neo4j driver: {e}")
        finally:
            _neo4j_driver = None


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
    validation_query = """
    OPTIONAL MATCH (s:ClassSession {sessionId: $session_id})
    OPTIONAL MATCH (t:TimeSlot {timeSlotId: $new_timeslot_id})
    RETURN s IS NOT NULL AS session_exists, t IS NOT NULL AS timeslot_exists
    """
    val_result = await neo4j_session.run(
        validation_query, session_id=session_id, new_timeslot_id=new_timeslot_id
    )
    val_record = await val_result.single()

    if not val_record or not val_record["session_exists"]:
        return "STATUS: ERROR. The provided session_id does not exist in the database. Please check the context and use a VALID Class Session ID, or ask the user to clarify."

    if not val_record["timeslot_exists"]:
        return "STATUS: ERROR. The proposed_timeslot_id does not exist. Please select a valid timeslot ID."

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
