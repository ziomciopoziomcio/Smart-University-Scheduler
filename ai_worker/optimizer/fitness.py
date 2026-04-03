from .models import ScheduleChromosome, ClassSessionGene

SLOTS_PER_DAY = 12
TIMETABLE_DAYS = 5
MAX_SLOT_ID = SLOTS_PER_DAY * TIMETABLE_DAYS


class FitnessCalculator:
    def __init__(
        self,
        rooms_lookup: dict,
        instructors_lookup: dict,
        conflicting_groups: dict,
        group_to_profiles: dict,
        profile_counts: dict,
        instructors_assignments: dict,
    ) -> None:
        """Fitness calculator class init"""
        self.rooms_lookup = rooms_lookup
        self.instructors_lookup = instructors_lookup
        self.conflicting_groups = conflicting_groups
        self.group_to_profiles = group_to_profiles
        self.profile_counts = profile_counts
        self.instructors_assignments = instructors_assignments

        self.W_DAY_USED = 100
        self.W_GAP_SLOT = 50
        self.W_MAX_GAP = 200  # gap longer than 2 slots
        self.W_ROOM_SIZE = 1  # per one free seat
        self.W_CAMPUS_CHANGE = 500  # without gap
        self.W_FATIGUE = 150  # day longer than 6 time slots in a day
        self.W_BUILDING_CHANGE = 20
        self.W_ROOM_CHANGE = 10

        self.W_INSTR_DAY_USED = 150
        self.W_INSTR_GAP_SLOT = 75
        self.W_INSTR_MAX_GAP = 300
        self.W_INSTR_CAMPUS_CHANGE = 750
        self.W_INSTR_FATIGUE = 200
        self.W_INSTR_BUILDING_CHANGE = 30
        self.W_INSTR_ROOM_CHANGE = 15

        self.W_TOO_MUCH_STUDENTS = 5000
        self.W_HARD_PENALTY = 100000
        self.W_WORKLOAD_MISMATCH = 500

    def calculate_fitness(self, chromosome: ScheduleChromosome) -> float:
        """Calculates fitness score for a given schedule chromosome
        :param chromosome: ScheduleChromosome to calculate fitness for
        :return: fitness score (lower is better)
        """
        penalty = 0.0

        penalty += self._evaluate_completeness(chromosome)

        penalty += self._check_collisions(chromosome)
        penalty += self._evaluate_time_efficiency(chromosome)
        penalty += self._evaluate_room_usage(chromosome)
        penalty += self._evaluate_location_logic(chromosome)

        penalty += self._evaluate_instructor_time_efficiency(chromosome)
        penalty += self._evaluate_instructor_location_logic(chromosome)

        chromosome.fitness_score = penalty
        return penalty

    def _evaluate_completeness(self, chromosome: ScheduleChromosome) -> float:
        """
        Helper function to penalize unscheduled or partially scheduled genes.
        :param chromosome: ScheduleChromosome to evaluate
        :return: Penalty score for missing assignments
        """
        penalty = 0.0
        for gene in chromosome.genes:
            if gene.timeslot_id is None:
                penalty += self.W_HARD_PENALTY

            if gene.room_id is None:
                penalty += self.W_HARD_PENALTY

            if gene.instructor_id is None:
                penalty += self.W_HARD_PENALTY

        return penalty

    def _evaluate_room_usage(self, chromosome: ScheduleChromosome) -> float:
        """
        Helper function to evaluate room usage
        :param chromosome: ScheduleChromosome to calculate fitness for
        :return: Penalty score (lower is better)
        """
        penalty = 0.0
        for gene in chromosome.genes:
            if gene.room_id and gene.room_id in self.rooms_lookup:
                room_cap = self.rooms_lookup[gene.room_id]["room_capacity"]

                if gene.group_size > room_cap:
                    penalty += self.W_TOO_MUCH_STUDENTS
                else:
                    wasted = room_cap - gene.group_size
                    penalty += self.W_ROOM_SIZE * wasted

        return penalty

    def _check_collisions(self, chromosome: ScheduleChromosome) -> float:
        """
        Helper function to check collisions
        :param chromosome: ScheduleChromosome to calculate fitness for
        :return: Penalty score (lower is better)
        """
        buckets, penalty = self._build_collision_buckets(chromosome.genes)

        penalty += self._evaluate_bucket_collisions(buckets, chromosome.genes)

        return penalty

    def _build_collision_buckets(self, genes: list) -> tuple[dict, float]:
        """
        Builds buckets of genes indexed by (week, slot) to limit comparisons.
        Returns the buckets dictionary and any base penalty (e.g. for invalid configs).
        """
        buckets = {}
        penalty = 0.0

        for idx, gene in enumerate(genes):
            if gene.timeslot_id is not None:
                penalty += self._add_gene_to_buckets(idx, gene, buckets)

        return buckets, penalty

    def _add_gene_to_buckets(
        self, idx: int, gene: ClassSessionGene, buckets: dict
    ) -> float:
        """
        Helper function to process a single gene and assign it to time buckets.
        Returns the penalty incurred by this gene (if any).
        :param idx: Index of gene to process
        :param gene: Gene to process
        :param buckets: The dictionary to update with gene indices
        :return: Penalty score (lower is better)
        """
        active_weeks = getattr(gene, "active_weeks", None)

        if active_weeks is None:
            return 0.0

        if active_weeks == []:
            return self.W_HARD_PENALTY

        start_slot = gene.timeslot_id

        duration = max(1, getattr(gene, "duration_slots", 1))

        if (start_slot - 1) % SLOTS_PER_DAY + duration > SLOTS_PER_DAY:
            return self.W_HARD_PENALTY

        if start_slot + duration - 1 > MAX_SLOT_ID:
            return self.W_HARD_PENALTY

        for week in active_weeks:
            for slot in range(start_slot, start_slot + duration):
                buckets.setdefault((week, slot), []).append(idx)

        return 0.0

    def _evaluate_bucket_collisions(self, buckets: dict, genes: list) -> float:
        """
        Iterates over overlapping time buckets and checks for resource conflicts.
        """
        penalty = 0.0
        seen_pairs = set()

        for indices in buckets.values():
            n = len(indices)
            for i in range(n):
                idx1 = indices[i]
                g1 = genes[idx1]

                for j in range(i + 1, n):
                    idx2 = indices[j]
                    pair = (idx1, idx2) if idx1 < idx2 else (idx2, idx1)

                    if pair in seen_pairs:
                        continue
                    seen_pairs.add(pair)

                    if self._has_resource_conflict(g1, genes[idx2]):
                        penalty += self.W_HARD_PENALTY

        return penalty

    @staticmethod
    def _do_weeks_overlap(weeks1: list | None, weeks2: list | None) -> bool:
        """
        Helper function to determine if two sets of active weeks overlap.
        None implies "all weeks". Empty list [] implies "no weeks".
        """
        if weeks1 == [] or weeks2 == []:
            return False

        if weeks1 and weeks2:
            return not set(weeks1).isdisjoint(weeks2)

        return True

    @staticmethod
    def _is_time_overlap(g1: ClassSessionGene, g2: ClassSessionGene) -> bool:
        """
        Checks if two genes overlap in time (slots and weeks).
        :param g1: First Gene to check
        :param g2: Second Gene to check
        :return: True if they overlap, False otherwise
        """
        if g1.timeslot_id is None or g2.timeslot_id is None:
            return False

        if not FitnessCalculator._do_weeks_overlap(
            getattr(g1, "active_weeks", None), getattr(g2, "active_weeks", None)
        ):
            return False

        start1 = g1.timeslot_id
        duration1 = max(1, getattr(g1, "duration_slots", 1))
        end1 = start1 + duration1

        start2 = g2.timeslot_id
        duration2 = max(1, getattr(g2, "duration_slots", 1))
        end2 = start2 + duration2

        return start1 < end2 and start2 < end1

    def _has_resource_conflict(
        self, g1: ClassSessionGene, g2: ClassSessionGene
    ) -> bool:
        """
        Helper function to check if two genes have a resource conflict (room or instructor)
        :param g1: First Gene to check
        :param g2: Second Gene to check
        :return: True if there is a resource conflict, False otherwise
        """
        if g1.room_id is not None and g1.room_id == g2.room_id:
            return self._is_time_overlap(g1, g2)

        if g1.instructor_id is not None and g1.instructor_id == g2.instructor_id:
            return self._is_time_overlap(g1, g2)

        if g1.group_id == g2.group_id:
            return self._is_time_overlap(g1, g2)

        if g2.group_id in self.conflicting_groups.get(g1.group_id, set()):
            return self._is_time_overlap(g1, g2)

        return False

    def _evaluate_location_logic(self, chromosome: ScheduleChromosome) -> float:
        """
        Helper function to evaluate location logic (campuses, buildings) PER PROFILE
        :param chromosome: ScheduleChromosome to evaluate location logic for
        :return: Penalty score (lower is better)
        """
        penalty = 0.0
        profile_itinerary = self._build_weekly_profile_itinerary(chromosome)

        for profile_id, weeks_dict in profile_itinerary.items():
            multiplier = self.profile_counts.get(profile_id, 1)
            for _week, items in weeks_dict.items():
                sorted_genes = sorted(items, key=lambda x: x.timeslot_id)

                for k in range(len(sorted_genes) - 1):
                    penalty += self._calculate_location_penalty(
                        sorted_genes[k],
                        sorted_genes[k + 1],
                        multiplier,
                        self.W_CAMPUS_CHANGE,
                        self.W_BUILDING_CHANGE,
                        self.W_ROOM_CHANGE,
                    )

        return penalty

    @staticmethod
    def _should_skip_location_check(g1, g2) -> bool:
        """
        Checks if genes are on different days, lack rooms, or don't share weeks.
        :param g1: First Gene to check
        :param g2: Second Gene to check
        :return: True if genes are on different days or lack shared weeks, False otherwise
        """
        day1 = (g1.timeslot_id - 1) // SLOTS_PER_DAY
        day2 = (g2.timeslot_id - 1) // SLOTS_PER_DAY

        if day1 != day2:
            return True

        if not g1.room_id or not g2.room_id:
            return True

        weeks1 = getattr(g1, "active_weeks", None)
        weeks2 = getattr(g2, "active_weeks", None)
        if weeks1 and weeks2:
            if set(weeks1).isdisjoint(weeks2):
                return True

        return False

    def _get_campus_change_penalty(
        self, gap: int, multiplier: int, w_campus_change: float
    ) -> float:
        """
        Calculates penalty for changing campus based on the available gap.
        :param gap: Gap to calculate penalty for
        :param multiplier: multiplier to calculate penalty for
        :param w_campus_change: Specific weight for campus change
        :return: Penalty score (lower is better)
        """
        if gap == 0:
            return w_campus_change * 2.0 * multiplier
        if gap == 1:
            return w_campus_change * 0.2 * multiplier

        return w_campus_change * 0.5 * multiplier

    def _calculate_location_penalty(
        self,
        g1,
        g2,
        multiplier: int,
        w_campus_change: float,
        w_building_change: float,
        w_room_change: float,
    ) -> float:
        """
        Calculates location penalty for a pair of consecutive genes.
        :param g1: First Gene to calculate penalty for
        :param g2: Second Gene to calculate penalty for
        :param multiplier: multiplier to calculate penalty for
        :param w_campus_change: Penalty weight for changing campus
        :param w_building_change: Penalty weight for changing building
        :param w_room_change: Penalty weight for changing room
        :return: Penalty score (lower is better)
        """
        if self._should_skip_location_check(g1, g2):
            return 0.0

        finish_slot_g1 = g1.timeslot_id + getattr(g1, "duration_slots", 1)
        gap = max(0, g2.timeslot_id - finish_slot_g1)

        r1 = self.rooms_lookup.get(g1.room_id)
        r2 = self.rooms_lookup.get(g2.room_id)

        if r1 is None or r2 is None:
            # Missing room information indicates an invalid chromosome; apply hard penalty
            return self.W_HARD_PENALTY * multiplier
        if r1["campus_id"] != r2["campus_id"]:
            return self._get_campus_change_penalty(gap, multiplier, w_campus_change)

        if r1["building_id"] != r2["building_id"]:
            return w_building_change * multiplier

        if g1.room_id != g2.room_id:
            return w_room_change * multiplier

        return 0.0

    def _build_weekly_profile_itinerary(self, chromosome: ScheduleChromosome) -> dict:
        """
        Helper function to build profile itineraries mapped by week.
        :param chromosome: ScheduleChromosome to build profile itineraries for
        :return: Dictionary with profiles mapped by week
        """
        profile_itinerary = {}

        for gene in chromosome.genes:
            if gene.timeslot_id is not None:
                self._assign_gene_to_profiles(gene, profile_itinerary)

        return profile_itinerary

    def _assign_gene_to_profiles(self, gene: ClassSessionGene, itinerary: dict) -> None:
        """
        Helper function to assign a single gene to the appropriate profiles and weeks.
        :param gene: Gene to assign
        :param itinerary: The dictionary to update
        """
        active_weeks = getattr(gene, "active_weeks", None)

        if active_weeks == []:
            return

        profiles_in_group = self.group_to_profiles.get(gene.group_id, [])

        weeks = active_weeks if active_weeks is not None else [None]

        for profile_id in profiles_in_group:
            weekly_dict = itinerary.setdefault(profile_id, {})

            for week in weeks:
                weekly_dict.setdefault(week, []).append(gene)

    def _evaluate_time_efficiency(self, chromosome: ScheduleChromosome) -> float:
        penalty = 0.0
        profile_itinerary = self._build_weekly_profile_itinerary(chromosome)

        for profile_id, weeks_dict in profile_itinerary.items():
            multiplier = self.profile_counts.get(profile_id, 1)

            for _week, genes in weeks_dict.items():
                days_active = set((g.timeslot_id - 1) // SLOTS_PER_DAY for g in genes)
                penalty += len(days_active) * self.W_DAY_USED * multiplier

                for day in days_active:
                    day_genes = sorted(
                        [
                            g
                            for g in genes
                            if (g.timeslot_id - 1) // SLOTS_PER_DAY == day
                        ],
                        key=lambda x: x.timeslot_id,
                    )
                    penalty += self._calculate_daily_penalty(
                        day_genes,
                        multiplier,
                        self.W_GAP_SLOT,
                        self.W_MAX_GAP,
                        self.W_FATIGUE,
                    )
        return penalty

    def _evaluate_instructor_time_efficiency(
        self, chromosome: ScheduleChromosome
    ) -> float:
        """
        Helper function to evaluate time efficiency for instructors
        :param chromosome: ScheduleChromosome to evaluate time efficiency for
        :return: Penalty score (lower is better)
        """
        penalty = 0.0
        instructor_itinerary = self._build_weekly_instructor_itinerary(chromosome)

        for _, weeks_dict in instructor_itinerary.items():
            for _week, genes in weeks_dict.items():
                days_active = set((g.timeslot_id - 1) // SLOTS_PER_DAY for g in genes)
                penalty += len(days_active) * self.W_INSTR_DAY_USED

                for day in days_active:
                    day_genes = sorted(
                        [
                            g
                            for g in genes
                            if (g.timeslot_id - 1) // SLOTS_PER_DAY == day
                        ],
                        key=lambda x: x.timeslot_id,
                    )
                    penalty += self._calculate_daily_penalty(
                        day_genes,
                        1,
                        self.W_INSTR_GAP_SLOT,
                        self.W_INSTR_MAX_GAP,
                        self.W_INSTR_FATIGUE,
                    )
        return penalty

    def _evaluate_instructor_location_logic(
        self, chromosome: ScheduleChromosome
    ) -> float:
        """
        Helper function to evaluate location logic for instructors
        :param chromosome: ScheduleChromosome to evaluate location logic for
        :return: Penalty score (lower is better)
        """
        penalty = 0.0
        instructor_itinerary = self._build_weekly_instructor_itinerary(chromosome)

        for _, weeks_dict in instructor_itinerary.items():
            for _week, items in weeks_dict.items():
                sorted_genes = sorted(items, key=lambda x: x.timeslot_id)

                for k in range(len(sorted_genes) - 1):
                    penalty += self._calculate_location_penalty(
                        sorted_genes[k],
                        sorted_genes[k + 1],
                        1,
                        self.W_INSTR_CAMPUS_CHANGE,
                        self.W_INSTR_BUILDING_CHANGE,
                        self.W_INSTR_ROOM_CHANGE,
                    )
        return penalty

    def _build_weekly_instructor_itinerary(
        self, chromosome: ScheduleChromosome
    ) -> dict:
        """
        Helper function to build instructor itinerary mapped by week for time efficiency evaluation.
        :param chromosome: ScheduleChromosome to build instructor itinerary for
        :return: Dictionary with instructor itineraries mapped by week
        """
        instructor_itinerary = {}

        for gene in chromosome.genes:
            if gene.timeslot_id is not None and gene.instructor_id is not None:
                self._assign_instructor_gene(gene, instructor_itinerary)

        return instructor_itinerary

    def _assign_instructor_gene(self, gene: ClassSessionGene, itinerary: dict) -> None:
        """Helper function to assign a single gene to the instructor's weekly itinerary."""
        if gene.instructor_id not in self.instructors_lookup:
            raise ValueError(
                f"Unknown instructor_id {gene.instructor_id!r} encountered in ClassSessionGene during itinerary construction."
            )

        active_weeks = getattr(gene, "active_weeks", None)

        if active_weeks == []:
            return

        weeks = active_weeks if active_weeks is not None else [None]

        weekly_dict = itinerary.setdefault(gene.instructor_id, {})

        for week in weeks:
            weekly_dict.setdefault(week, []).append(gene)

    def _calculate_daily_penalty(
        self,
        day_genes: list,
        multiplier: int,
        w_gap: float,
        w_max_gap: float,
        w_fatigue: float,
    ) -> float:
        """
        Helper function to calculate daily penalty
        :param day_genes: list of genes for a single day
        :param multiplier: multiplier to calculate penalty for
        :param w_gap: penalty per gap slot
        :param w_max_gap: penalty for a gap longer than 2 slots
        :param w_fatigue: penalty per slot above 6 in a day
        :return: Penalty score (lower is better)
        """
        penalty = 0.0
        daily_slots_count = 0

        for k, value in enumerate(day_genes):
            g = value
            daily_slots_count += getattr(g, "duration_slots", 1)

            if k < len(day_genes) - 1:
                next_g = day_genes[k + 1]
                finish_slot_g = g.timeslot_id + getattr(g, "duration_slots", 1)
                gap = next_g.timeslot_id - finish_slot_g

                if gap > 0:
                    penalty += gap * w_gap * multiplier
                    if gap > 2:
                        penalty += w_max_gap * multiplier

        if daily_slots_count > 6:
            penalty += (daily_slots_count - 6) * w_fatigue * multiplier

        return penalty
