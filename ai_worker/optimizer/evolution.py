import copy
import random

from . import models


class EvolutionEngine:
    """Evolution Engine"""

    def __init__(
        self,
        available_rooms: list[int],
        available_instructors: list[int],
        max_timeslots: int = 60,
        tournament_size: int = 3,
        mutation_rate: float = 0.05,
    ):
        self.available_instructors = available_instructors
        self.available_rooms = available_rooms
        self.max_timeslots = max_timeslots
        self.tournament_size = tournament_size
        self.mutation_rate = mutation_rate

    def tournament_selection(
        self, population: list[models.ScheduleChromosome]
    ) -> models.ScheduleChromosome:
        """
        Tournament selection
        :param population: List of ScheduleChromosome to select from
        :return: Selected ScheduleChromosome
        """
        tournament_pool = random.sample(population, self.tournament_size)
        return min(
            tournament_pool,
            key=lambda chrom: getattr(chrom, "fitness_score", float("inf")),
        )

    @staticmethod
    def crossover(
        parents: list[models.ScheduleChromosome],
    ) -> list[models.ScheduleChromosome]:
        """
        Crossover between parents to create offspring
        :param parents: List of ScheduleChromosome to crossover
        :return: List of offspring ScheduleChromosome
        """
        if len(parents) < 2:
            return [
                models.ScheduleChromosome(genes=copy.deepcopy(parent.genes))
                for parent in parents
            ]

        offspring = []

        for i in range(0, len(parents), 2):
            parent1 = parents[i]
            parent2 = parents[i + 1] if i + 1 < len(parents) else parents[0]

            if len(parent1.genes) < 2 or len(parent2.genes) < 2:
                offspring.append(
                    models.ScheduleChromosome(genes=copy.deepcopy(parent1.genes))
                )
                offspring.append(
                    models.ScheduleChromosome(genes=copy.deepcopy(parent2.genes))
                )
                continue
            crossover_point = random.randint(1, len(parent1.genes) - 1)
            child1_genes = copy.deepcopy(
                parent1.genes[:crossover_point]
            ) + copy.deepcopy(parent2.genes[crossover_point:])
            child2_genes = copy.deepcopy(
                parent2.genes[:crossover_point]
            ) + copy.deepcopy(parent1.genes[crossover_point:])

            offspring.append(models.ScheduleChromosome(genes=child1_genes))
            offspring.append(models.ScheduleChromosome(genes=child2_genes))

        return offspring[: len(parents)]

    def mutation(
        self, population: list[models.ScheduleChromosome]
    ) -> list[models.ScheduleChromosome]:
        """
        Mutation of the population
        :param population: List of ScheduleChromosome to mutate
        :return: List of mutated ScheduleChromosome
        """

        for chrom in population:
            for gene in chrom.genes:
                if random.random() < self.mutation_rate:
                    gene.timeslot_id = random.randint(1, self.max_timeslots)
                    if self.available_rooms:
                        gene.room_id = random.choice(self.available_rooms)
                    if self.available_instructors:
                        gene.instructor_id = random.choice(self.available_instructors)
                    if (
                        gene.allowed_week_patterns
                        and len(gene.allowed_week_patterns) > 1
                    ):
                        gene.selected_pattern_index = random.randint(
                            0, len(gene.allowed_week_patterns) - 1
                        )

        return population
