import logging
from typing import LiteralString

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


async def search_available_times_in_neo4j(session_id: str, neo4j_session) -> str:
    cypher_query: LiteralString = """
    MATCH (s:ClassSession {sessionId: $session_id})
    MATCH (s)-[:AT_TIME]->(ts:TimeSlot)
    WITH s, count(ts) AS duration

    OPTIONAL MATCH (s)-[:TAUGHT_BY]->(i:Instructor)
    WITH s, duration, i
    MATCH (s)-[:FOR_GROUP]->(g:Group)
    WITH s, duration, i, collect(g) AS groups, sum(g.membersAmount) AS total_students

    MATCH p = (start_ts:TimeSlot)-[:NEXT*0..5]->(end_ts:TimeSlot)
    WHERE length(p) = duration - 1
      AND start_ts.dayOfWeek = end_ts.dayOfWeek

    WITH s, i, groups, total_students, nodes(p) AS block_slots, [t IN nodes(p) | t.timeSlotId] AS timeslot_ids, start_ts, end_ts

    WHERE (i IS NULL OR NOT ANY(t IN block_slots WHERE (i)<-[:TAUGHT_BY]-(:ClassSession)-[:AT_TIME]->(t)))
      AND NOT ANY(g IN groups WHERE ANY(t IN block_slots WHERE (g)<-[:FOR_GROUP]-(:ClassSession)-[:AT_TIME]->(t)))

    MATCH (r:Room)
    WHERE r.roomCapacity >= total_students
      AND NOT ANY(t IN block_slots WHERE (r)<-[:HELD_IN]-(:ClassSession)-[:AT_TIME]->(t))

    RETURN
        start_ts.dayOfWeek AS day,
        start_ts.startTime AS start_time,
        end_ts.endTime AS end_time,
        timeslot_ids,
        collect(r.roomId)[0..3] AS available_room_ids
    ORDER BY day, start_time
    LIMIT 5
    """
    try:
        result = await neo4j_session.run(cypher_query, session_id=session_id)
        records = await result.data()

        if not records:
            return "No available time slots and rooms found for this class session."

        options = ["FOUND AVAILABLE OPTIONS:"]
        for idx, rec in enumerate(records, 1):
            options.append(
                f"Option {idx}:\n"
                f" - Day and time: {rec['day']}, {rec['start_time']} - {rec['end_time']}\n"
                f" - Required timeslot_ids: {rec['timeslot_ids']}\n"
                f" - Available room IDs (choose one): {rec['available_room_ids']}"
            )
        return "\n".join(options)
    except Exception as e:
        return f"Database error while searching for slots: {e}"
