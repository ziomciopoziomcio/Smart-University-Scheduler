import asyncio
import logging
from typing import LiteralString

from sqlalchemy.orm import Session

from ..academics import models as academics_models

logger = logging.getLogger(__name__)


def _get_user_neo4j_identities(user_id: int, db: Session) -> tuple[int, list[int]]:
    employee = (
        db.query(academics_models.Employees)
        .filter(academics_models.Employees.user_id == user_id)
        .first()
    )
    if employee:
        return int(employee.id), [-1]

    student = (
        db.query(academics_models.Students)
        .filter(academics_models.Students.user_id == user_id)
        .first()
    )
    if student:
        student_groups = (  # todo: check all students group
            db.query(academics_models.Group_members.group)
            .filter(academics_models.Group_members.student == student.id)
            .all()
        )
        group_ids = [g[0] for g in student_groups]
        return -1, group_ids if group_ids else [-1]

    return -1, [-1]


async def get_user_schedule_context(user_id: int, neo4j_session, db: Session) -> str:
    """
    Gets schedule from Neo4j
    :param user_id: The user id for which to fetch the schedule
    :param neo4j_session: The Neo4j session to use for the query
    :param db: Database session
    :return: A string representation of the user's upcoming schedule, or an error message if the schedule cannot be fetched.
    """
    instructor_id, group_ids = await asyncio.to_thread(
        _get_user_neo4j_identities, user_id, db
    )
    cypher_query = """
        OPTIONAL MATCH (i:Instructor {instructorId: $instructor_id})<-[:TAUGHT_BY]-(s_inst:ClassSession)
        OPTIONAL MATCH (g:Group)<-[:FOR_GROUP]-(s_group:ClassSession) WHERE g.groupId IN $group_ids

        WITH collect(s_inst) + collect(s_group) AS all_sessions
        UNWIND all_sessions AS s
        WITH DISTINCT s WHERE s IS NOT NULL

        MATCH (s)-[:OF_COURSE]->(c:Course)
        MATCH (s)-[:HELD_IN]->(r:Room)
        MATCH (s)-[:AT_TIME]->(t:TimeSlot)

        WITH s, c, r, t.dayOfWeek AS day, min(t.timeSlotId) AS min_slot, max(t.timeSlotId) AS max_slot
        MATCH (ts_start:TimeSlot {timeSlotId: min_slot})
        MATCH (ts_end:TimeSlot {timeSlotId: max_slot})

        RETURN
            s.sessionId AS session_id,
            c.courseName AS course_name,
            c.classType AS class_type,
            day,
            ts_start.startTime AS start_time,
            ts_end.endTime AS end_time,
            r.roomName AS room_name
        ORDER BY day, start_time
        LIMIT 15
        """

    try:
        result = await neo4j_session.run(
            cypher_query, instructor_id=instructor_id, group_ids=group_ids
        )
        records = await result.data()

        if not records:
            return "The user has no upcoming classes in the schedule."

        context_lines = ["UPCOMING SCHEDULE FOR THIS USER:"]
        for idx, record in enumerate(records, 1):
            session_id = record.get("session_id", "UNKNOWN_ID")
            line = (
                f"- Course: {record['course_name']} ({record['class_type']})\n"
                f"   Time: {record['day']}, {record['start_time']} - {record['end_time']}\n"
                f"   Room: {record['room_name']}\n"
                f"   Class Session ID: {session_id}\n"
            )
            context_lines.append(line)

        return "\n".join(context_lines)

    except Exception as e:
        logger.exception(f"Failed to fetch schedule from Neo4j: {e}")
        return "SYSTEM ERROR: Could not fetch the schedule from the database."


SEARCH_SLOTS_QUERY: LiteralString = """
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
        collect({id: r.roomId, name: r.roomName})[0..3] AS available_rooms
    ORDER BY day, start_time
    LIMIT 5
    """


async def search_available_times_in_neo4j(session_id: str, neo4j_session) -> str:
    try:
        result = await neo4j_session.run(SEARCH_SLOTS_QUERY, session_id=session_id)
        records = await result.data()

        if not records:
            return "No available time slots and rooms found for this class session."

        options = [
            "FOUND AVAILABLE OPTIONS (KEEP IDs SECRET, SHOW ONLY NAMES TO USER):"
        ]
        for idx, rec in enumerate(records, 1):
            rooms_str = ", ".join(
                [f"{r['name']} (ID: {r['id']})" for r in rec["available_rooms"]]
            )
            options.append(
                f"Option {idx}:\n"
                f" - Day and time: {rec['day']}, {rec['start_time']} - {rec['end_time']}\n"
                f" - Internal timeslot_ids: {rec['timeslot_ids']}\n"
                f" - Available rooms: {rooms_str}"
            )
        return "\n".join(options)
    except Exception as e:
        return f"Database error while searching for slots: {e}"
