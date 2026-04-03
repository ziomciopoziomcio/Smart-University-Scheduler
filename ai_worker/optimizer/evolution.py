import copy
import random
from typing import List

from . import models


class EvolutionEngine:
    """Evolution Engine"""

    def __init__(self, tournament_size: int = 3, mutation_rate: float = 0.05):
        self.available_instructors = None
        self.available_rooms = None
        self.max_timeslots = None
        self.tournament_size = tournament_size
        self.mutation_rate = mutation_rate

    def tournament_selection(
        self, population: List[models.ScheduleChromosome]
    ) -> List[models.ScheduleChromosome]:
        """
        Tournament selection
        :param population: List of ScheduleChromosome to select from
        :return: List of selected ScheduleChromosome
        """
        tournament_pool = random.sample(population, self.tournament_size)
        return min(
            tournament_pool,
            key=lambda chrom: getattr(chrom, "fitness_score", float("inf")),
        )

    @staticmethod
    def crossover(
        parents: List[models.ScheduleChromosome],
    ) -> List[models.ScheduleChromosome]:
        """
        Crossover between parents to create offspring
        :param parents: List of ScheduleChromosome to crossover
        :return: List of offspring ScheduleChromosome
        """
        offspring = []

        for i in range(0, len(parents), 2):
            parent1 = parents[i]
            parent2 = parents[i + 1] if i + 1 < len(parents) else parents[0]

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
        self, population: List[models.ScheduleChromosome]
    ) -> List[models.ScheduleChromosome]:
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
