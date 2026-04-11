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

        def make_unassigned_gene(gene):
            unassigned_gene = copy.deepcopy(gene)
            for attr_name, attr_value in (
                ("timeslot_id", None),
                ("room_id", None),
                ("instructor_id", None),
                ("active_weeks", []),
            ):
                if hasattr(unassigned_gene, attr_name):
                    setattr(unassigned_gene, attr_name, attr_value)
            return unassigned_gene

        def pick_safe_gene(
            primary_gene,
            primary_resources,
            secondary_gene,
            secondary_resources,
            used_resources,
        ):
            primary_safe = not any(
                resource in used_resources for resource in primary_resources
            )
            if primary_safe:
                return copy.deepcopy(primary_gene), primary_resources

            secondary_safe = not any(
                resource in used_resources for resource in secondary_resources
            )
            if secondary_safe:
                return copy.deepcopy(secondary_gene), secondary_resources

            return make_unassigned_gene(primary_gene), []

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
                    active_weeks = getattr(gene, "active_weeks", None)
                    if active_weeks is None:
                        active_weeks = [None]

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

                default_c1_safe = not any(res in c1_used_resources for res in g1_res)
                default_c2_safe = not any(res in c2_used_resources for res in g2_res)
                swap_c1_safe = not any(res in c1_used_resources for res in g2_res)
                swap_c2_safe = not any(res in c2_used_resources for res in g1_res)

                default_pair_safe = default_c1_safe and default_c2_safe
                swap_pair_safe = swap_c1_safe and swap_c2_safe
                prefer_swap = random.random() < 0.5

                if prefer_swap and swap_pair_safe:
                    child1_gene = copy.deepcopy(g2)
                    child2_gene = copy.deepcopy(g1)
                    child1_resources = g2_res
                    child2_resources = g1_res
                elif default_pair_safe:
                    child1_gene = copy.deepcopy(g1)
                    child2_gene = copy.deepcopy(g2)
                    child1_resources = g1_res
                    child2_resources = g2_res
                elif swap_pair_safe:
                    child1_gene = copy.deepcopy(g2)
                    child2_gene = copy.deepcopy(g1)
                    child1_resources = g2_res
                    child2_resources = g1_res
                else:
                    child1_gene, child1_resources = pick_safe_gene(
                        g1, g1_res, g2, g2_res, c1_used_resources
                    )
                    child2_gene, child2_resources = pick_safe_gene(
                        g2, g2_res, g1, g1_res, c2_used_resources
                    )

                child1_genes.append(child1_gene)
                child2_genes.append(child2_gene)
                c1_used_resources.update(child1_resources)
                c2_used_resources.update(child2_resources)

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

                    mutation_targets = ["timeslot", "room", "instructor"]
                    if (
                        gene.allowed_week_patterns
                        and len(gene.allowed_week_patterns) > 1
                    ):
                        mutation_targets.append("pattern")

                    target = random.choice(mutation_targets)

                    if target == "timeslot":
                        gene.timeslot_id = random.randint(1, self.max_timeslots)
                    elif target == "room":
                        allowed_rooms = getattr(gene, "allowed_rooms", None)
                        candidate_rooms = allowed_rooms or self.available_rooms
                        if candidate_rooms:
                            gene.room_id = random.choice(candidate_rooms)
                    elif target == "instructor":
                        allowed_instructors = getattr(gene, "allowed_instructors", None)
                        candidate_instructors = (
                            allowed_instructors or self.available_instructors
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
                                gene.instructor_id = random.choice(
                                    candidate_instructors
                                )
                    elif target == "pattern":
                        gene.selected_pattern = random.randint(
                            0, len(gene.allowed_week_patterns) - 1
                        )

        return population
