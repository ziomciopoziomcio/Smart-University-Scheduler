import random
from typing import List

from . import models


class EvolutionEngine:
    """Evolution Engine"""

    def __init__(self, tournament_size: int = 3, mutation_rate: float = 0.05):
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
