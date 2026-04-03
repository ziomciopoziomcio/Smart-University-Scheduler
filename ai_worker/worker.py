import asyncio
import concurrent.futures
import copy
import json
import multiprocessing
import os
import logging

from aiokafka import AIOKafkaConsumer

from data_provider import DataProvider
from neo4j_provider import Neo4jProvider
from optimizer import models, fitness, evolution

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

    return fitness.FitnessCalculator(
        rooms_lookup=data["rooms"].set_index("room_id").to_dict("index"),
        instructors_lookup=data["employees"].set_index("id").to_dict("index"),
        group_to_profiles=group_to_profiles,
        profile_counts=profile_counts,
        conflicting_groups=conflicting_groups,
    )


def _generate_initial_population(
    base_genes: list[models.ClassSessionGene], size: int
) -> list[models.ScheduleChromosome]:
    """
    Generates an initial population of ScheduleChromosomes based on the provided base genes.
    :param base_genes: List of ClassSessionGene instances representing the initial set of genes.
    :param size: The desired size of the population to generate.
    :return: A list of ScheduleChromosome instances forming the initial population.
    """
    population = []
    for _ in range(size):
        # TODO: Greedy logic
        genes_copy = copy.deepcopy(base_genes)
        population.append(models.ScheduleChromosome(genes=genes_copy))
    return population


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
    :param data: Dictionary containing all necessary data for the optimization process. It is expected to include at least:
    :return: An instance of EvolutionEngine initialized with the provided data.
    """
    rooms_ids = data["rooms"]["room_id"].tolist() if "room_id" in data["rooms"] else []
    instructors_ids = (
        data["employees"]["id"].tolist() if "id" in data["employees"] else []
    )
    return evolution.EvolutionEngine(
        available_rooms=rooms_ids,
        available_instructors=instructors_ids,
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

    calculator = _create_fitness_calculator(data)
    population_size = 50
    population = _generate_initial_population(base_genes, population_size)

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

            new_population = copy.deepcopy(population[:2])
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
