import logging
import os
import uuid

import pandas as pd
from neo4j import AsyncGraphDatabase, Query

from optimizer import models

logger = logging.getLogger(__name__)

SAVE_SCHEDULE_QUERY = Query("""
        MATCH (old_s:ClassSession {facultyId: $faculty_id})
        DETACH DELETE old_s

        WITH count(*) as _

        UNWIND $batch AS row
        MATCH (c:Course {courseCode: row.course_code, classType: row.class_type})
        MATCH (g:Group) WHERE g.groupId IN row.group_ids
        WITH row, c, collect(g) AS matched_groups, $faculty_id AS faculty_id, $batch AS b
        WHERE size(matched_groups) = size(row.group_ids)

        CREATE (s:ClassSession {sessionId: row.session_id, weeks: row.weeks, facultyId: faculty_id, createdAt: datetime()})
        MERGE (s)-[:OF_COURSE]->(c)

        WITH s, row, matched_groups, b

        OPTIONAL MATCH (i:Instructor {instructorId: row.instructor_id})
        WHERE row.instructor_id IS NULL OR i IS NOT NULL

        OPTIONAL MATCH (r:Room {roomId: row.room_id})
        WHERE row.room_id IS NULL OR r IS NOT NULL

        OPTIONAL MATCH (t:TimeSlot {timeSlotId: row.timeslot_id})
        WHERE row.timeslot_id IS NULL OR t IS NOT NULL

        FOREACH (_ IN CASE WHEN i IS NOT NULL THEN [1] ELSE [] END | MERGE (s)-[:TAUGHT_BY]->(i))
        FOREACH (_ IN CASE WHEN r IS NOT NULL THEN [1] ELSE [] END | MERGE (s)-[:HELD_IN]->(r))
        FOREACH (_ IN CASE WHEN t IS NOT NULL THEN [1] ELSE [] END | MERGE (s)-[:AT_TIME]->(t))

        WITH s, matched_groups, b
        UNWIND matched_groups AS mg
        MERGE (s)-[:FOR_GROUP]->(mg)

        WITH count(DISTINCT s) as created_count, size(b) as total_size
        RETURN
            CASE
                WHEN created_count = total_size THEN created_count
                ELSE 1 / (created_count - created_count)
            END as result
""")


class Neo4jProvider:
    """Neo4j Provider"""

    def __init__(self):
        uri = f"bolt://{os.getenv('NEO4J_HOST', 'neo4j')}:{os.getenv('NEO4J_PORT', '7687')}"
        user = os.getenv("NEO4J_USER")
        password = os.getenv("NEO4J_PASSWORD")

        if not user or not password:
            logger.error(
                "Neo4j credentials are not configured. Please set NEO4J_USER and "
                "NEO4J_PASSWORD environment variables."
            )
            raise RuntimeError(
                "Missing Neo4j credentials: NEO4J_USER and NEO4J_PASSWORD must be set."
            )
        self.driver = AsyncGraphDatabase.driver(uri, auth=(user, password))

    async def close(self) -> None:
        """Close the driver"""
        await self.driver.close()

    async def initialize_base_graph(self) -> None:
        """
        Clear existing graphs and generate timeslots
        :return: None
        """

        clear_query = Query("MATCH (t:TimeSlot) DETACH DELETE t")

        days_of_week = ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays"]
        schedule_data = []
        slot_id_counter = 1

        for day in days_of_week:
            slots = []
            for hour in range(8, 20):
                start_time = f"{hour:02d}:15"
                end_time = f"{hour+1:02d}:00"

                slots.append(
                    {"id": slot_id_counter, "start": start_time, "end": end_time}
                )
                slot_id_counter += 1
            schedule_data.append({"day": day, "slots": slots})

        query = Query("""
        UNWIND $schedule_data AS day_data
        WITH day_data.day AS dayOfWeek, day_data.slots AS slots

        UNWIND slots AS slot
        MERGE (t:TimeSlot {timeSlotId: slot.id})
        SET t.dayOfWeek = dayOfWeek,
        t.startTime = slot.start,
        t.endTime = slot.end

        WITH dayOfWeek, collect(t) AS day_slots

        UNWIND range(0, size(day_slots)-2) AS i
        WITH day_slots[i] AS current_slot, day_slots[i+1] AS next_slot
        MERGE (current_slot)-[:NEXT]->(next_slot)
        """)

        try:
            async with self.driver.session() as session:
                clear_result = await session.run(clear_query)
                await clear_result.consume()
                logger.info("Clear existing graph")

                init_result = await session.run(query, schedule_data=schedule_data)
                await init_result.consume()
        except Exception as e:
            logger.exception(f"Exception occurred during Graph DB init: {e}")
            raise

    async def save_class_session(self, session_data: dict) -> None:
        """
        Save a class session to the graph database
        :param session_data: A dictionary containing class session details
        :return: None
        """
        raw_class_session_id = session_data.get("class_session_id")
        new_room_id = session_data.get("new_room_id")
        new_timeslot_id = session_data.get("new_timeslot_id")

        if raw_class_session_id is None or (
            isinstance(raw_class_session_id, str) and not raw_class_session_id.strip()
        ):
            raise ValueError("class_session_id is required")

        class_session_id = str(raw_class_session_id)
        queries = []
        parameters = {"session_id": class_session_id}
        if new_room_id is not None:
            queries.append(
                {
                    "cypher": """
            MATCH (s:ClassSession {sessionId: $session_id})
            MATCH (new_r:Room {roomId: $new_room_id})
            OPTIONAL MATCH (s)-[old_rel:HELD_IN]->(:Room)
            DELETE old_rel
            MERGE (s)-[:HELD_IN]->(new_r)
            RETURN s.sessionId AS updated_id
            """,
                    "error_msg": f"Failed to update room: ClassSession '{class_session_id}' or Room '{new_room_id}' not found in Neo4j.",
                }
            )
            parameters["new_room_id"] = int(new_room_id)

        if new_timeslot_id is not None:
            queries.append(
                {
                    "cypher": """
            MATCH (s:ClassSession {sessionId: $session_id})
            MATCH (new_t:TimeSlot {timeSlotId: $new_timeslot_id})
            OPTIONAL MATCH (s)-[old_rel:AT_TIME]->(:TimeSlot)
            DELETE old_rel
            MERGE (s)-[:AT_TIME]->(new_t)
            RETURN s.sessionId AS updated_id
            """,
                    "error_msg": f"Failed to update timeslot: ClassSession '{class_session_id}' or TimeSlot '{new_timeslot_id}' not found in Neo4j.",
                }
            )
            parameters["new_timeslot_id"] = int(new_timeslot_id)

        if not queries:
            logger.info(
                f"No valid updates provided for ClassSession {class_session_id}."
            )
            return

        try:
            async with self.driver.session() as session:
                for q_info in queries:
                    result = await session.run(Query(q_info["cypher"]), **parameters)
                    record = await result.single()
                    if not record:
                        err_msg = q_info["error_msg"]
                        raise ValueError(
                            f"Failed to update ClassSession {class_session_id}: {err_msg}"
                        )
                    await result.consume()
                logger.info(
                    f"Successfully updated ClassSession {class_session_id} in Neo4j."
                )
        except Exception as e:
            logger.exception(
                f"Failed to update ClassSession {class_session_id} in Neo4j: {e}"
            )
            raise ValueError(f"Failed to update ClassSession {class_session_id}: {e}")

    async def load_infrastructure(self, rooms_df: pd.DataFrame) -> None:
        """
        Load infrastructure from the graph database
        :param rooms_df: Room dataframe
        :return: None
        """
        rooms_cleaned = rooms_df.where(pd.notnull(rooms_df), None)
        rooms_data = rooms_cleaned.to_dict(orient="records")

        query = Query("""
        UNWIND $rooms_data AS row

        MERGE (c:Campus {campusId: row.campus_id})
        ON CREATE SET c.campusShort = row.campus_short

        MERGE (b:Building {buildingId: row.building_id})
        ON CREATE SET b.buildingNumber = row.building_number
        MERGE (b)-[:IN_CAMPUS]->(c)

        MERGE (r:Room {roomId: row.room_id})
                SET r.roomName = row.room_name,
                    r.roomCapacity = row.room_capacity,
                    r.pcAmount = row.pc_amount,
                    r.projectorAvailability = row.projector_availability,
                    r.facultyId = row.faculty_id,
                    r.unitId = row.unit_id

                // 4. Spinamy salę z budynkiem
                MERGE (r)-[:IN_BUILDING]->(b)
                """)

        try:
            async with self.driver.session() as session:
                result = await session.run(query, rooms_data=rooms_data)
                await result.consume()
                logger.info("Load infrastructure")

        except Exception as e:
            logger.exception(
                f"Exception occurred during Graph DB init (infrastructure): {e}"
            )
            raise RuntimeError("Critical error: Failed to load infrastructure.")

    async def load_instructors(self, employees_df: pd.DataFrame) -> None:
        """
        Load instructors from the graph database
        :param employees_df: Employees dataframe
        :return: None
        """
        instructors_cleaned = employees_df.where(pd.notnull(employees_df), None)
        instructors_data = instructors_cleaned.to_dict(orient="records")

        query = Query("""
            UNWIND $instructors_data AS row

            MERGE (i:Instructor {instructorId: row.id})

            SET i.firstName = row.name,
            i.lastName = row.surname,
            i.degree = row.degree,
            i.unitId = row.unit_id
            """)

        try:
            async with self.driver.session() as session:
                result = await session.run(query, instructors_data=instructors_data)
                await result.consume()
                logger.info("Load instructors")
        except Exception as e:
            logger.exception(
                f"Exception occurred during Graph DB init (instructors): {e}"
            )
            raise RuntimeError("Critical error: Failed to load instructors.")

    async def load_requirements(self, requirements_df: pd.DataFrame) -> None:
        """
        Load requirements from the graph database
        :param requirements_df: Requirements dataframe
        :return: None
        """
        requirements_cleaned = requirements_df.where(pd.notnull(requirements_df), None)

        if "class_type" in requirements_cleaned.columns:
            requirements_cleaned["class_type"] = (
                requirements_cleaned["class_type"]
                .astype(str)
                .str.split(".")
                .str[-1]
                .str.strip()
                .str.upper()
            )

        req_data = requirements_cleaned.to_dict(orient="records")

        query = Query("""
        UNWIND $req_data AS row

        MERGE (g:Group {groupId: row.group_id})
        SET g.groupName = row.group_name,
        g.programName = row.program_name,
        g.membersAmount = row.members_amount

        MERGE (c:Course {courseCode: row.course_code, classType: row.class_type})
        SET c.courseName = row.course_name,
        c.hours = row.class_hours,
        c.pcNeeded = row.pc_needed,
        c.projectorNeeded = row.projector_needed,
        c.maxMembersPerClass = row.max_group_participants_number

        MERGE (g)-[:REQUIRES]->(c)
        """)

        try:
            async with self.driver.session() as session:
                result = await session.run(query, req_data=req_data)
                await result.consume()
                logger.info("Load requirements")

        except Exception as e:
            logger.exception(
                f"Exception occurred during Graph DB init (requirements): {e}"
            )
            raise RuntimeError("Critical error: Failed to load requirements.")

    async def load_competencies(self, competencies_df: pd.DataFrame) -> None:
        """
        Load competencies from the graph database
        :param competencies_df: Competencies dataframe
        :return: None
        """
        comp_cleaned = competencies_df.where(pd.notnull(competencies_df), None)

        if "class_type" in comp_cleaned.columns:
            comp_cleaned["class_type"] = (
                comp_cleaned["class_type"]
                .astype(str)
                .str.split(".")
                .str[-1]
                .str.strip()
                .str.upper()
            )

        comp_data = comp_cleaned.to_dict(orient="records")

        query = Query("""
            UNWIND $comp_data AS row
            MATCH (i:Instructor {instructorId: row.employee_id})
            MATCH (c:Course {courseCode: row.course_code, classType: row.class_type})

            MERGE (i)-[rel:CAN_TEACH]->(c)
            SET rel.assignedHours = row.hours
            """)

        try:
            async with self.driver.session() as session:
                result = await session.run(query, comp_data=comp_data)
                await result.consume()
                logger.info("Load competencies")
        except Exception as e:
            logger.exception(
                f"Exception occurred during Graph DB init (competencies): {e}"
            )
            raise RuntimeError("Critical error: Failed to load competencies.")

    @staticmethod
    def _get_incomplete_genes(best_chromosome: models.ScheduleChromosome) -> list[dict]:
        return [
            {
                "gene_index": i,
                "course_code": g.course_code,
                "class_type": g.class_type,
                "group_size": g.group_size,
                "group_ids": g.group_ids,
                "missing": [
                    res
                    for res, val in [
                        ("instructor", g.instructor_id),
                        ("room", g.room_id),
                        ("timeslot", g.timeslot_id),
                    ]
                    if val is None
                ],
            }
            for i, g in enumerate(best_chromosome.genes)
            if None in (g.instructor_id, g.room_id, g.timeslot_id)
        ]

    @staticmethod
    def _prepare_batch(best_chromosome: models.ScheduleChromosome) -> list[dict]:
        """
        Prepare batch data for saving the best chromosome.
        """
        return [
            {
                "session_id": str(uuid.uuid4()),
                "instructor_id": (
                    int(gene.instructor_id) if gene.instructor_id is not None else None
                ),
                "room_id": int(gene.room_id) if gene.room_id is not None else None,
                "group_ids": [int(g_id) for g_id in gene.group_ids],
                "timeslot_id": (
                    int(gene.timeslot_id) if gene.timeslot_id is not None else None
                ),
                "course_code": int(gene.course_code),
                "class_type": str(gene.class_type).upper(),
                "weeks": gene.active_weeks,
            }
            for gene in best_chromosome.genes
        ]

    async def save_best_schedule(
        self, best_chromosome: models.ScheduleChromosome, faculty_id: int
    ) -> list[dict]:
        """
        Save the best chromosome and return incomplete genes.
        """
        incomplete_genes = self._get_incomplete_genes(best_chromosome)
        if incomplete_genes:
            logger.warning(
                f"Saving schedule: {len(incomplete_genes)} class sessions have missing assignments. Details: {incomplete_genes}"
            )

        data_to_save = self._prepare_batch(best_chromosome)

        try:
            async with self.driver.session() as session:
                result = await session.run(
                    SAVE_SCHEDULE_QUERY, batch=data_to_save, faculty_id=faculty_id
                )
                await result.consume()
                logger.info(f"Successfully exported schedule for faculty {faculty_id}")
                return incomplete_genes
        except Exception as e:
            logger.error(f"Failed to save schedule: {e}")
            raise ValueError(f"Neo4j Transaction Failed: {e}")
