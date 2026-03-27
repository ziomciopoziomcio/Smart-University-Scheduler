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
        self.W_TOO_MUCH_STUDENTS = 5000

        self.W_HARD_PENALTY = 100000

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

    def _evaluate_room_usage(self, chromosome: ScheduleChromosome) -> float:
        """
        Helper function to evaluate room usage
        :param chromosome: ScheduleChromosome to calculate fitness for
        :return: Penalty score (lower is better)
        """
        penalty = 0.0
        for gene in chromosome.genes:
            if gene.room_id:
                room_cap = self.rooms_lookup[gene.room_id].capacity

                if gene.group_size > room_cap:
                    penalty += self.W_TOO_MUCH_STUDENTS
                else:
                    wasted = room_cap - gene.group_size
                    penalty += self.W_GAP_SLOT * wasted

        return penalty

    def _check_collisions(self, chromosome: ScheduleChromosome) -> float:
        """
        Helper function to check collisions
        :param chromosome: ScheduleChromosome to calculate fitness for
        :return: Penalty score (lower is better)
        """
        penalty = 0.0
        genes = chromosome.genes

        for i in range(len(genes)):
            for j in range(i + 1, len(genes)):
                g1, g2 = genes[i], genes[j]
                if g1.timeslot_id == g2.timeslot_id:
                    shared_weeks = set(g1.active_weeks) & set(g2.active_weeks)
                    if shared_weeks:
                        if (
                            g1.room_id == g2.room_id
                            or g1.instructor_id == g2.instructor_id
                            or g1.group_id == g2.group_id
                        ):
                            penalty += self.W_HARD_PENALTY
        return penalty
