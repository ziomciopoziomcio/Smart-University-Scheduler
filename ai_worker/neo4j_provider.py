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
        MATCH (i:Instructor {instructorId: row.instructor_id})
        MATCH (r:Room {roomId: row.room_id})
        MATCH (t:TimeSlot {timeSlotId: row.timeslot_id})
        MATCH (g:Group {groupId: row.group_id})
        MATCH (c:Course {courseCode: row.course_code, classType: row.class_type})

        CREATE (s:ClassSession {sessionId: row.session_id, weeks: row.weeks, facultyId: $faculty_id, createdAt: datetime()})
        MERGE (s)-[:TAUGHT_BY]->(i)
        MERGE (s)-[:HELD_IN]->(r)
        MERGE (s)-[:FOR_GROUP]->(g)
        MERGE (s)-[:AT_TIME]->(t)
        MERGE (s)-[:OF_COURSE]->(c)

        WITH count(s) as created_count

        RETURN
            CASE
                WHEN created_count = size($batch) THEN created_count
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
            queries.append("""
            MATCH (s:ClassSession {sessionId: $session_id})
            MATCH (old_r:Room)<-[old_rel:HELD_IN]-(s)
            MATCH (new_r:Room {roomId: $new_room_id})
            DELETE old_rel
            MERGE (s)-[:HELD_IN]->(new_r)
            """)
            parameters["new_room_id"] = int(new_room_id)

        if new_timeslot_id is not None:
            queries.append("""
            MATCH (s:ClassSession {sessionId: $session_id})
            MATCH (old_t:TimeSlot)<-[old_rel:AT_TIME]-(s)
            MATCH (new_t:TimeSlot {timeSlotId: $new_timeslot_id})
            DELETE old_rel
            MERGE (s)-[:AT_TIME]->(new_t)
            """)
            parameters["new_timeslot_id"] = int(new_timeslot_id)

        if not queries:
            logger.info(
                f"No valid updates provided for ClassSession {class_session_id}."
            )
            return

        try:
            async with self.driver.session() as session:
                for q in queries:
                    await session.run(Query(q), **parameters)
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
    def _validate_schedule(
        best_chromosome: models.ScheduleChromosome, faculty_id: int
    ) -> None:
        """
        Validate the best chromosome before saving
        :param best_chromosome: The best ScheduleChromosome to validate
        :param faculty_id: The faculty for which the schedule is being saved
        :return: None
        """
        incomplete_genes = [
            {"index": i, "course": g.course_code, "type": g.class_type}
            for i, g in enumerate(best_chromosome.genes)
            if None in (g.instructor_id, g.room_id, g.timeslot_id)
        ]

        if incomplete_genes:
            logger.error(
                f"Refusing to save partial schedule for faulty {faculty_id}: {len(incomplete_genes)}/{len(best_chromosome.genes)} genes are incomplete. "
            )
            raise ValueError(
                f"Cannot save schedule for faculty {faculty_id}: {len(incomplete_genes)} genes are missing assignments."
            )

    @staticmethod
    def _prepare_batch(best_chromosome: models.ScheduleChromosome) -> list[dict]:
        """
        Prepare batch data for saving the best chromosome
        :param best_chromosome: The best ScheduleChromosome to prepare
        :return: A list of dictionaries representing the batch data
        """
        return [
            {
                "session_id": str(uuid.uuid4()),
                "instructor_id": int(gene.instructor_id),
                "room_id": int(gene.room_id),
                "group_id": int(gene.group_id),
                "timeslot_id": int(gene.timeslot_id),
                "course_code": str(gene.course_code),
                "class_type": str(gene.class_type).upper(),
                "weeks": gene.active_weeks,
            }
            for gene in best_chromosome.genes
        ]

    async def save_best_schedule(
        self, best_chromosome: models.ScheduleChromosome, faculty_id: int
    ) -> None:
        """
        Save the best chromosome
        :param best_chromosome: The best ScheduleChromosome to save
        :param faculty_id: The faculty to save the best chromosome
        :return: None
        """
        self._validate_schedule(best_chromosome, faculty_id)
        data_to_save = self._prepare_batch(best_chromosome)

        try:
            async with self.driver.session() as session:
                result = await session.run(
                    SAVE_SCHEDULE_QUERY, batch=data_to_save, faculty_id=faculty_id
                )
                await result.consume()
                logger.info(f"Successfully exported schedule for faculty {faculty_id}")
        except Exception as e:
            logger.error(f"Failed to save schedule: {e}")
            raise ValueError(f"Neo4j Transaction Failed: {e}")
