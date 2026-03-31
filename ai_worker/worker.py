import asyncio
import concurrent.futures
import copy
import json
import os
import logging
from functools import partial

from aiokafka import AIOKafkaConsumer

from data_provider import DataProvider
from neo4j_provider import Neo4jProvider
from optimizer import models, fitness

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _evaluate_single_chromosome(
    chromosome: models.ScheduleChromosome, calculator: fitness.FitnessCalculator
) -> models.ScheduleChromosome:
    """
        Evaluates the fitness of a single chromosome using the provided fitness calculator.
    :param chromosome: The ScheduleChromosome to be evaluated.
    :param calculator: An instance of FitnessCalculator that contains the logic to compute the fitness score based on the chromosome's genes and the underlying data.
    :return: The same ScheduleChromosome instance with its fitness_score attribute updated based on the evaluation.
    """
    chromosome.fitness_score = calculator.calculate_fitness(chromosome)
    return chromosome


def run_ai_optimizer_sync(
    faculty_id: str, data: dict, base_genes: list[models.ClassSessionGene]
) -> models.ScheduleChromosome:
    """
    Synchronous function to run the AI optimizer for a given faculty and data. This function is intended to be called in a separate thread to avoid blocking the main event loop.
    :param faculty_id: The identifier of the faculty for which the schedule optimization should be performed.
    :param data: A dictionary containing all necessary data for the optimization process, including
    :return: - rooms: The best chromosome
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
    max_workers = int(os.getenv("GA_MAX_WORKERS", "1"))

    with concurrent.futures.ProcessPoolExecutor(max_workers=max_workers) as executor:
        for gen in range(generations):
            eval_func = partial(_evaluate_single_chromosome, calculator=calculator)
            population = list(executor.map(eval_func, population))
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

        # await run_ai_optimizer(faculty_id) TODO

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
