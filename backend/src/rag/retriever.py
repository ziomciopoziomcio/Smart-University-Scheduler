import logging

logger = logging.getLogger(__name__)


async def get_user_schedule_context(user_id: int, neo4j_session) -> str:
    """
    Gets schedule from Neo4j
    :param user_id: The user id for which to fetch the schedule
    :param neo4j_session: The Neo4j session to use for the query
    :return: A string representation of the user's upcoming schedule, or an error message if the schedule cannot be fetched.
    """

    cypher_query = """
    MATCH (i:Instructor {instructorId: $user_id})<-[:TAUGHT_BY]-(s:ClassSession)
    MATCH (s)-[:OF_COURSE]->(c:Course)
    MATCH (s)-[:AT_TIME]->(t:TimeSlot)
    MATCH (s)-[:HELD_IN]->(r:Room)

    RETURN
        s.sessionId AS session_id,
        c.courseName AS course_name,
        c.classType AS class_type,
        t.dayOfWeek AS day,
        t.startTime AS start_time,
        t.endTime AS end_time,
        r.roomName AS room_name
    ORDER BY t.dayOfWeek, t.startTime
    LIMIT 15
    """

    try:

        result = await neo4j_session.run(cypher_query, user_id=user_id)
        records = await result.data()

        if not records:
            return "The user has no upcoming classes in the schedule."

        context_lines = ["UPCOMING SCHEDULE FOR THIS USER:"]

        for idx, record in enumerate(records, 1):
            session_id = record.get("session_id", "UNKNOWN_ID")

            line = (
                f"{idx}. Course: {record['course_name']} ({record['class_type']})\n"
                f"   Time: {record['day']}, {record['start_time']} - {record['end_time']}\n"
                f"   Room: {record['room_name']}\n"
                f"   Class Session ID: {session_id}\n"
            )
            context_lines.append(line)

        return "\n".join(context_lines)

    except Exception as e:
        logger.exception(f"Failed to fetch schedule from Neo4j for user {user_id}: {e}")
        return "SYSTEM ERROR: Could not fetch the schedule from the database."
