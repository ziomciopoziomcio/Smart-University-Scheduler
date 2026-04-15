import asyncio
import concurrent.futures
import copy
import json
import multiprocessing
import os
import logging

from aiokafka import AIOKafkaConsumer, AIOKafkaProducer

from data_provider import DataProvider
from neo4j_provider import Neo4jProvider
from optimizer import models, fitness, evolution, greedy

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_global_calculator: fitness.FitnessCalculator | None = None


def _greedy_assign_worker(args):
    base_genes, data = args

    genes_copy = copy.deepcopy(base_genes)
    greedy.greedy_assign(genes_copy, data, randomize=True)
    return genes_copy


def _init_worker(calculator: fitness.FitnessCalculator) -> None:
    """
    Initializes the worker process by setting up a global fitness calculator instance.
    :param calculator: An instance of FitnessCalculator that will be used by the worker to evaluate
    :return: None
    """
    global _global_calculator
    _global_calculator = calculator


def _evaluate_single_chromosome(
    chromosome: models.ScheduleChromosome,
) -> models.ScheduleChromosome:
    """
    Evaluates the fitness of a single chromosome using the provided fitness calculator.
    :param chromosome: The ScheduleChromosome to be evaluated.
    :return: The same ScheduleChromosome instance with its fitness_score attribute
        updated based on the evaluation.
    """
    if _global_calculator is None:
        raise RuntimeError(
            "Fitness calculator was not initialized in worker process. "
            "Did ProcessPoolExecutor initializer _init_worker run?"
        )
    _global_calculator.calculate_fitness(chromosome)
    return chromosome


def _create_fitness_calculator(data: dict) -> fitness.FitnessCalculator:
    """
    Creates the fitness calculator for the provided data.
    :param data: Dictionary containing all necessary data for the optimization process. It is expected to include at least:
    :return: An instance of FitnessCalculator initialized with the provided data.
    """
    group_to_profiles, profile_counts = DataProvider.get_student_profiles(
        data["group_members"]
    )
    conflicting_groups = DataProvider.get_conflicting_groups_dict(
        data["conflicting_groups"]
    )
    instructor_assignments = DataProvider.get_instructor_assignments(
        data["competencies"]
    )

    return fitness.FitnessCalculator(
        rooms_lookup=data["rooms"].set_index("room_id").to_dict("index"),
        instructors_lookup=data["employees"].set_index("id").to_dict("index"),
        group_to_profiles=group_to_profiles,
        profile_counts=profile_counts,
        conflicting_groups=conflicting_groups,
        instructor_assignments=instructor_assignments,
    )


def _seed_population_greedy(
    base_genes: list[models.ClassSessionGene], size: int, data: dict
) -> list[models.ScheduleChromosome]:
    """
    Generates one deterministic individual (randomize=False) and (size-1)
    randomized greedy individuals in parallel. Returns a list of
    ScheduleChromosome instances. Uses ProcessPoolExecutor for parallelism;
    large `data` may incur pickling overhead.
    :param base_genes: List of initial genes to be assigned.
    :param size: Target population size.
    :param data: Dictionary containing faculty infrastructure and requirements.
    :return: A list of initialized ScheduleChromosome objects.
    """
    population = []
    if size <= 0:
        return population

    genes0 = copy.deepcopy(base_genes)
    greedy.greedy_assign(genes0, data, randomize=False)
    population.append(models.ScheduleChromosome(genes=genes0))

    n_random = max(0, size - 1)
    if n_random == 0:
        return population

    max_workers = min(n_random, os.cpu_count() or 1)
    args_iterable = [(base_genes, data) for _ in range(n_random)]

    mp_ctx = multiprocessing.get_context("spawn")
    with concurrent.futures.ProcessPoolExecutor(
        max_workers=max_workers, mp_context=mp_ctx
    ) as exe:
        for genes_assigned in exe.map(_greedy_assign_worker, args_iterable):
            population.append(models.ScheduleChromosome(genes=genes_assigned))

    return population


def _generate_initial_population(
    base_genes: list[models.ClassSessionGene],
    size: int,
    data: dict,
) -> list[models.ScheduleChromosome]:
    """
    Generates initial population.
    Currently uses greedy seeding (see _seed_population_greedy).
    """
    return _seed_population_greedy(base_genes=base_genes, size=size, data=data)


def _get_max_workers(population_size: int) -> int:
    """
    Parsing and validating workers amount from environment variable, with sensible defaults and limits to prevent resource exhaustion.
    :param population_size: The size of the population, used to cap the number of workers to avoid creating more processes than necessary.
    :return: The number of worker processes to use for parallel evaluation.
    """
    raw_val = os.getenv("GA_MAX_WORKERS")
    if not raw_val:
        return 1
    try:
        parsed = int(raw_val)
        if parsed < 1:
            logger.warning("GA_MAX_WORKERS must be positive. Falling back to 1.")
            return 1
        safe_max = min(os.cpu_count() or 1, population_size)
        if parsed > safe_max:
            logger.warning(
                f"GA_MAX_WORKERS={parsed} exceeds safe limit {safe_max}. Capping to {safe_max}."
            )
            return safe_max
        return parsed
    except ValueError:
        logger.warning(f"Invalid GA_MAX_WORKERS value '{raw_val}'. Falling back to 1.")
        return 1


def _create_evolution_engine(data: dict) -> evolution.EvolutionEngine:
    """
    Creates the evolution engine for the provided data.
    :param data: Dictionary containing all necessary data for the optimization process.
    :return: An instance of EvolutionEngine initialized with the provided data.
    """
    room_ids = data["rooms"]["room_id"].tolist() if "room_id" in data["rooms"] else []
    instructor_ids = (
        data["employees"]["id"].tolist() if "id" in data["employees"] else []
    )
    instructor_assignments = data.get("instructor_assignments")
    if instructor_assignments is None:
        competencies = data.get("competencies")
        instructor_assignments = (
            DataProvider.get_instructor_assignments(competencies)
            if competencies is not None
            else {}
        )
    return evolution.EvolutionEngine(
        available_rooms=room_ids,
        available_instructors=instructor_ids,
        instructor_assignments=instructor_assignments,
    )


def run_ai_optimizer_sync(
    faculty_id: str, data: dict, base_genes: list[models.ClassSessionGene]
) -> models.ScheduleChromosome:
    """
    Run the AI optimizer synchronously for a given faculty and input data.

    This function is intended to be executed in a separate thread or process so that
    it does not block the main event loop.

    :param faculty_id: Identifier of the faculty for which the schedule optimization
        should be performed.
    :param data: Dictionary containing all necessary data for the optimization
        process. It is expected to include at least:

            - ``"group_members"``: data used to derive student profiles per group.
            - ``"conflicting_groups"``: data describing groups that cannot be
              scheduled at the same time.
            - ``"rooms"``: tabular structure (e.g., DataFrame) with room
              information, indexed by ``"room_id"``.
            - ``"employees"``: tabular structure (e.g., DataFrame) with instructor
              information, indexed by ``"id"``.
    :param base_genes: List of ``ClassSessionGene`` instances representing the
        initial set of genes from which the population will be constructed.
    :return: The best ``ScheduleChromosome`` found after running the genetic
        algorithm.
    """
    logger.info(f"Starting AI optimizer for {faculty_id}")

    if "competencies" in data and "instructor_assignments" not in data:
        data["instructor_assignments"] = DataProvider.get_instructor_assignments(
            data["competencies"]
        )

    calculator = _create_fitness_calculator(data)
    population_size = 50
    population = _generate_initial_population(base_genes, population_size, data)

    engine = _create_evolution_engine(data)

    max_workers = _get_max_workers(population_size)
    chunk_size = max(1, population_size // (max_workers * 2))
    generations = 100

    with concurrent.futures.ProcessPoolExecutor(
        max_workers=max_workers,
        mp_context=multiprocessing.get_context("spawn"),
        initializer=_init_worker,
        initargs=(calculator,),
    ) as executor:
        for gen in range(generations):
            population = list(
                executor.map(
                    _evaluate_single_chromosome, population, chunksize=chunk_size
                )
            )

            population.sort(
                key=lambda chrom: getattr(chrom, "fitness_score", float("inf"))
            )

            new_population = list(population[:2])
            parents = [
                engine.tournament_selection(population)
                for _ in range(population_size - len(new_population))
            ]

            offspring = engine.crossover(parents)
            offspring = engine.mutation(offspring)

            new_population.extend(offspring)
            population = new_population

    population.sort(key=lambda chrom: getattr(chrom, "fitness_score", float("inf")))
    return population[0]


async def process_task(
    task_data: dict,
    data_prov: DataProvider,
    neo4j_prov: Neo4jProvider,
    producer: AIOKafkaProducer,
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
    :param producer: AIOKafka producer object.
    :return: None
    """

    def _normalize_identifier(value):
        if isinstance(value, int):
            return value
        if isinstance(value, str):
            stripped_value = value.strip()
            if stripped_value.isdigit():
                return int(stripped_value)
            return stripped_value
        return value

    task_id = _normalize_identifier(task_data.get("task_id"))
    faculty_id = _normalize_identifier(task_data.get("faculty_id"))
    result_topic = os.getenv("KAFKA_RESULT_TOPIC", "schedule.optimization.results")

    try:
        if not faculty_id:
            logger.error("Faculty id not provided")
            await producer.send_and_wait(
                result_topic,
                {
                    "task_id": task_id,
                    "status": "FAILED",
                    "error": "Faculty id not provided",
                },
            )
            return

        if not isinstance(faculty_id, int):
            error_msg = f"Invalid faculty_id format: {faculty_id} (type {type(faculty_id)}). Expected int or numeric string."
            logger.error(error_msg)
            await producer.send_and_wait(
                result_topic,
                {
                    "task_id": task_id,
                    "status": "FAILED",
                    "error": error_msg,
                },
            )
            return

        data = await asyncio.to_thread(data_prov.get_all_data, faculty_id)
        await neo4j_prov.initialize_base_graph()

        await neo4j_prov.load_infrastructure(data["rooms"])
        await neo4j_prov.load_instructors(data["employees"])
        await neo4j_prov.load_requirements(data["requirements"])
        await neo4j_prov.load_competencies(data["competencies"])

        base_genes = data_prov.prepare_initial_genes(data)

        best_schedule = await asyncio.to_thread(
            run_ai_optimizer_sync, faculty_id, data, base_genes
        )

        await neo4j_prov.save_best_schedule(best_schedule, faculty_id)

        await producer.send_and_wait(
            result_topic,
            {
                "task_id": task_id,
                "faculty_id": faculty_id,
                "status": "COMPLETED",
                "fitness": float(best_schedule.fitness_score),
                "message": "Optimisation successful.",
            },
        )
        logger.info(f"Task {task_id} completed successfully")

    except asyncio.CancelledError:
        logger.warning(f"Task {task_id} cancelled during execution")
        raise

    except Exception as e:
        logger.exception(f"Critical error: {e}")
        failure_message = {
            "task_id": task_id,
            "status": "FAILED",
            "error": str(e),
        }
        try:
            await producer.send_and_wait(result_topic, failure_message)
        except Exception:
            logger.exception(
                "Failed to publish failure result for task_id=%s after processing error: %s",
                task_id,
                e,
            )


async def process_reschedule_task(
    task_data: dict,
    neo4j_prov: Neo4jProvider,
    producer: AIOKafkaProducer,
) -> None:
    """
    Handler for rescheduling tasks triggered by schedule update events. This function listens for events indicating that a class session has been rescheduled (e.g., due to a room change or time change) and updates the Neo4j graph accordingly. It may also trigger re-evaluation of the schedule if necessary and publish results back to Kafka.
    :param task_data: Dictionary containing details about the rescheduling event. Expected keys may include:
    :param neo4j_prov: Neo4jProvider instance used to interact with the Neo4j database, allowing the function to update the graph with new scheduling information.
    :param producer: AIOKafkaProducer instance used to publish any necessary results or notifications back to Kafka after processing the rescheduling event.
    :return: None
    """
    suggestion_id = task_data.get("suggestion_id")
    class_session_id = task_data.get("class_session_id")
    result_topic = os.getenv("KAFKA_RESULT_TOPIC", "schedule.optimization.results")

    logger.info(
        f"Starting rescheduling task {suggestion_id} for session {class_session_id}"
    )

    try:
        await neo4j_prov.save_class_session(task_data)

        await producer.send_and_wait(
            result_topic,
            {
                "task_id": suggestion_id,
                "status": "COMPLETED",
                "message": f"Sucessfully rescheduled {suggestion_id} for session {class_session_id}",
                "type": "RESCHEDULE_UPDATE",
            },
        )
        logger.info(f"Task {suggestion_id} rescheduled successfully")

    except Exception as e:
        logger.exception(f"Critical error: {e}")
        try:
            await producer.send_and_wait(
                result_topic,
                {
                    "task_id": suggestion_id,
                    "status": "FAILED",
                    "error": str(e),
                    "type": "RESCHEDULE_UPDATE",
                },
            )
        except Exception as ex:
            logger.exception(
                f"Failed to publish failure result for reschedule task: {ex}"
            )


async def main() -> None:
    """
    Main function
    :return: None
    """
    kafka_url = os.getenv("KAFKA_URL", "kafka:29092")
    consumer = AIOKafkaConsumer(
        "schedule.optimization.requests",
        "schedule.session.reschedule",
        bootstrap_servers=kafka_url,
        group_id="smart_scheduler_ai_group",
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
        auto_offset_reset="earliest",
    )
    producer = AIOKafkaProducer(
        bootstrap_servers=kafka_url,
        value_serializer=lambda m: json.dumps(m).encode("utf-8"),
    )

    data_provider = DataProvider()
    neo4j_provider = Neo4jProvider()

    connected_consumer = False
    while not connected_consumer:
        try:
            await consumer.start()
            connected_consumer = True
        except Exception as e:
            logger.error(f"Failed to connect to Kafka (consumer): {e}")
            await asyncio.sleep(5)

    connected_producer = False
    while not connected_producer:
        try:
            await producer.start()
            connected_producer = True
        except Exception as e:
            logger.error(f"Failed to connect to Kafka (producer): {e}")
            await asyncio.sleep(5)

    try:
        async for msg in consumer:
            if msg.topic == "schedule.optimization.requests":
                await process_task(
                    msg.value, data_provider, neo4j_provider, producer
                )
            elif msg.topic == "schedule.session.reschedule":
                await process_reschedule_task(msg.value, neo4j_provider, producer)
            else:
                logger.warning(f"Received message for unknown topic {msg.topic}")
    finally:
        await consumer.stop()
        await producer.stop()
        await neo4j_provider.close()


if __name__ == "__main__":
    asyncio.run(main())
