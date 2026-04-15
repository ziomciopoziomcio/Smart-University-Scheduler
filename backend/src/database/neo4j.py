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
    query = """
        MATCH (target_session:ClassSession {sessionId: $session_id})-[:FOR_GROUP]->(g:Group)
        MATCH (g)<-[:FOR_GROUP]-(conflicting_session:ClassSession)-[:AT_TIME]->(t:TimeSlot {timeSlotId: $new_timeslot_id})
        WHERE target_session <> conflicting_session
        MATCH (conflicting_session)-[:OF_COURSE]->(c:Course)
        RETURN g.groupName AS group_name, c.courseName AS course_name
        """

    result = await neo4j_session.run(
        query, session_id=session_id, new_timeslot_id=new_timeslot_id
    )
    records = await result.data()

    if not records:
        return (
            "STATUS: OK. There are no conflicts. You can safely propose this timeslot."
        )

    conflicts = [f"Group '{r['group_name']}' has '{r['course_name']}'" for r in records]
    conflict_str = ", ".join(conflicts)

    return f"STATUS: CONFLICT. You CANNOT use this timeslot. Conflicts found: {conflict_str}. Propose a different time to the user."
