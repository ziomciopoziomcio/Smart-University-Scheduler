import asyncio
import concurrent.futures
import copy
import json
import os
import logging

from aiokafka import AIOKafkaConsumer

from data_provider import DataProvider
from neo4j_provider import Neo4jProvider
from optimizer import models, fitness

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_global_calculator: fitness.FitnessCalculator = None


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
    _global_calculator.calculate_fitness(chromosome)
    return chromosome


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

    group_to_profiles, profile_counts = DataProvider.get_student_profiles(
        data["group_members"]
    )
    conflicting_groups = DataProvider.get_conflicting_groups_dict(
        data["conflicting_groups"]
    )

    rooms_lookup = data["rooms"].set_index("room_id").to_dict("index")
    instructors_lookup = data["employees"].set_index("id").to_dict("index")

    calculator = fitness.FitnessCalculator(
        rooms_lookup=rooms_lookup,
        instructors_lookup=instructors_lookup,
        group_to_profiles=group_to_profiles,
        profile_counts=profile_counts,
        conflicting_groups=conflicting_groups,
    )
    population_size = 50
    population = []

    for _ in range(population_size):
        genes_copy = copy.deepcopy(base_genes)
        # TODO: Greedy
        chromosome = models.ScheduleChromosome(genes=genes_copy)
        population.append(chromosome)

    generations = 100
    raw_max_workers = os.getenv("GA_MAX_WORKERS")
    default_workers = 1
    if raw_max_workers is None:
        max_workers = default_workers
    else:
        try:
            parsed_workers = int(raw_max_workers)
            if parsed_workers < 1:
                logger.warning(
                    "GA_MAX_WORKERS must be a positive integer; got %r. "
                    "Falling back to %d.",
                    raw_max_workers,
                    default_workers,
                )
                max_workers = default_workers
            else:
                # Cap the number of workers to avoid resource exhaustion.
                cpu_count = os.cpu_count() or 1
                safe_max_workers = min(cpu_count, population_size)
                if parsed_workers > safe_max_workers:
                    logger.warning(
                        "GA_MAX_WORKERS=%d exceeds safe limit %d; capping to %d.",
                        parsed_workers,
                        safe_max_workers,
                        safe_max_workers,
                    )
                    max_workers = safe_max_workers
                else:
                    max_workers = parsed_workers
        except (TypeError, ValueError):
            logger.warning(
                "Invalid GA_MAX_WORKERS value %r. Falling back to %d.",
                raw_max_workers,
                default_workers,
            )
            max_workers = default_workers

    chunk_size = max(1, population_size // (max_workers * 2))

    with concurrent.futures.ProcessPoolExecutor(
        max_workers=max_workers, initializer=_init_worker, initargs=(calculator,)
    ) as executor:
        for gen in range(generations):
            population = list(
                executor.map(
                    _evaluate_single_chromosome, population, chunksize=chunk_size
                )
            )
            # TODO: selection, crossover, mutation to create new population

            population.sort(
                key=lambda chrom: getattr(chrom, "fitness_score", float("inf"))
            )

    return population[0]


async def process_task(
    task_data: dict, data_prov: DataProvider, neo4j_prov: Neo4jProvider
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
    :return: None
    """
    try:
        faculty_id = task_data.get("faculty_id")
        if not faculty_id:
            logger.error("Faculty id not provided")
            return

        data = await asyncio.to_thread(data_prov.get_all_data, faculty_id)
        await neo4j_prov.initialize_base_graph()

        await neo4j_prov.load_infrastructure(data["rooms"])
        await neo4j_prov.load_instructors(data["employees"])
        await neo4j_prov.load_requirements(data["requirements"])
        await neo4j_prov.load_competencies(data["competencies"])

        base_genes = data_prov.prepare_initial_genes(data)

        best_schedule = await asyncio.to_thread(  # noqa F841
            run_ai_optimizer_sync, faculty_id, data, base_genes
        )

        # TODO: Save best_schedule

    except Exception as e:
        logger.exception(f"Critical error: {e}")


async def main() -> None:
    """
    Main function
    :return: None
    """
    kafka_url = os.getenv("KAFKA_URL", "kafka:29092")
    consumer = AIOKafkaConsumer(
        "schedule.optimization.requests",
        bootstrap_servers=kafka_url,
        group_id="smart_scheduler_ai_group",
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
        auto_offset_reset="earliest",
    )

    data_provider = DataProvider()
    neo4j_provider = Neo4jProvider()

    connected = False
    while not connected:
        try:
            await consumer.start()
            connected = True
        except Exception as e:
            logger.error(f"Failed to connect to Kafka: {e}")
            await asyncio.sleep(5)

    try:
        async for msg in consumer:
            await process_task(msg.value, data_provider, neo4j_provider)
    finally:
        await consumer.stop()
        await neo4j_provider.close()


if __name__ == "__main__":
    asyncio.run(main())
