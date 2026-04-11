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
        instructor_assignments: dict[tuple[int, int, str], int] | None = None,
    ):
        self.available_instructors = available_instructors
        self.available_rooms = available_rooms
        self.max_timeslots = max_timeslots
        self.tournament_size = tournament_size
        self.mutation_rate = mutation_rate
        self.instructor_assignments = instructor_assignments

    def tournament_selection(
        self, population: list[models.ScheduleChromosome]
    ) -> models.ScheduleChromosome:
        """
        Tournament selection
        :param population: List of ScheduleChromosome to select from
        :return: Selected ScheduleChromosome
        """
        current_tournament_size = min(self.tournament_size, len(population))
        tournament_pool = random.sample(population, current_tournament_size)
        return min(
            tournament_pool,
            key=lambda chrom: getattr(chrom, "fitness_score", float("inf")),
        )

    @staticmethod
    def crossover(
        parents: list[models.ScheduleChromosome],
    ) -> list[models.ScheduleChromosome]:
        """
        Conflict-Aware Uniform Crossover.
        Crossover between parents to create offspring.
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

            child1_genes = []
            child2_genes = []
            c1_used_resources = set()
            c2_used_resources = set()

            for g1, g2 in zip(parent1.genes, parent2.genes):

                def get_resources(gene):
                    resources = []
                    timeslot_id = getattr(gene, "timeslot_id", None)
                    if timeslot_id is None:
                        return resources

                    duration_slots = max(1, getattr(gene, "duration_slots", 1) or 1)
                    active_weeks = getattr(gene, "active_weeks", None) or [None]

                    for week in active_weeks:
                        for slot_offset in range(duration_slots):
                            occupied_timeslot = timeslot_id + slot_offset
                            if getattr(gene, "room_id", None) is not None:
                                resources.append(
                                    f"ROOM_{gene.room_id}_WEEK_{week}_TIME_{occupied_timeslot}"
                                )
                            if getattr(gene, "instructor_id", None) is not None:
                                resources.append(
                                    f"INSTR_{gene.instructor_id}_WEEK_{week}_TIME_{occupied_timeslot}"
                                )

                    return resources

                g1_res = get_resources(g1)
                g2_res = get_resources(g2)

                swap_c1_safe = not any(res in c1_used_resources for res in g2_res)
                swap_c2_safe = not any(res in c2_used_resources for res in g1_res)

                if random.random() < 0.5 and swap_c1_safe and swap_c2_safe:
                    child1_genes.append(copy.deepcopy(g2))
                    child2_genes.append(copy.deepcopy(g1))
                    c1_used_resources.update(g2_res)
                    c2_used_resources.update(g1_res)
                else:
                    child1_genes.append(copy.deepcopy(g1))
                    child2_genes.append(copy.deepcopy(g2))
                    c1_used_resources.update(g1_res)
                    c2_used_resources.update(g2_res)

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
                if random.random() < self.mutation_rate:
                    allowed_rooms = getattr(gene, "allowed_rooms", None)
                    candidate_rooms = (
                        self.available_rooms
                        if allowed_rooms is None
                        else allowed_rooms
                    )
                    if candidate_rooms:
                        gene.room_id = random.choice(candidate_rooms)
                if random.random() < self.mutation_rate:
                    allowed_instructors = getattr(
                        gene, "allowed_instructors", None
                    )
                    candidate_instructors = (
                        self.available_instructors
                        if allowed_instructors is None
                        else allowed_instructors
                    )
                    if candidate_instructors:
                        if (
                            hasattr(self, "instructor_assignments")
                            and self.instructor_assignments
                        ):
                            weights = []
                            for instr_id in candidate_instructors:
                                target_hours = self.instructor_assignments.get(
                                    (instr_id, gene.course_code, gene.class_type), 0
                                )
                                weights.append(max(1, target_hours))
                            gene.instructor_id = random.choices(
                                candidate_instructors, weights=weights, k=1
                            )[0]
                        else:
                            gene.instructor_id = random.choice(candidate_instructors)
                if random.random() < self.mutation_rate:
                    if (
                        gene.allowed_week_patterns
                        and len(gene.allowed_week_patterns) > 1
                    ):
                        gene.selected_pattern_index = random.randint(
                            0, len(gene.allowed_week_patterns) - 1
                        )

        return population
