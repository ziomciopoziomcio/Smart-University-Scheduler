from .models import ScheduleChromosome


class FitnessCalculator:
    def __init__(self, rooms_lookup: dict, instructors_lookup: dict) -> None:
        """Fitness calculator class init"""
        self.rooms_lookup = rooms_lookup
        self.instructors_lookup = instructors_lookup

        self.W_DAY_USED = 100
        self.W_GAP_SLOT = 50
        self.W_MAX_GAP = 200  # gap longer than 2 slots
        self.W_ROOM_SIZE = 1  # per one free seat
        self.W_CAMPUS_CHANGE = 500  # without gap
        self.W_FATIGUE = 150  # day longer than 6 hours

    def calculate_fitness(self, chromosome: ScheduleChromosome) -> float:
        """Calculates fitness score for a given schedule chromosome
        :param chromosome: ScheduleChromosome to calculate fitness for
        :return: fitness score (lower is better)
        """
        penalty = 0.0
        penalty += self._check_overlaps(chromosome)
        penalty += self._evaluate_time_efficiency(chromosome)
        penalty += self._evaluate_room_usage(chromosome)
        penalty += self._evaluate_location_logic(chromosome)

        chromosome.fitness_score = penalty
        return penalty
