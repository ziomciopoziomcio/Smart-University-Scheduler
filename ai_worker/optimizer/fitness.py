from .models import ScheduleChromosome, ClassSessionGene


class FitnessCalculator:
    def __init__(
        self,
        rooms_lookup: dict,
        instructors_lookup: dict,
        conflicting_groups: dict,
        group_to_profiles: dict,
        profile_counts: dict,
    ) -> None:
        """Fitness calculator class init"""
        self.rooms_lookup = rooms_lookup
        self.instructors_lookup = instructors_lookup
        self.conflicting_groups = conflicting_groups
        self.group_to_profiles = group_to_profiles
        self.profile_counts = profile_counts

        self.W_DAY_USED = 100
        self.W_GAP_SLOT = 50
        self.W_MAX_GAP = 200  # gap longer than 2 slots
        self.W_ROOM_SIZE = 1  # per one free seat
        self.W_CAMPUS_CHANGE = 500  # without gap
        self.W_FATIGUE = 150  # day longer than 6 hours
        self.W_TOO_MUCH_STUDENTS = 5000
        self.W_BUILDING_CHANGE = 20
        self.W_ROOM_CHANGE = 10

        self.W_HARD_PENALTY = 100000

    def calculate_fitness(self, chromosome: ScheduleChromosome) -> float:
        """Calculates fitness score for a given schedule chromosome
        :param chromosome: ScheduleChromosome to calculate fitness for
        :return: fitness score (lower is better)
        """
        penalty = 0.0
        penalty += self._check_collisions(chromosome)
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
            if gene.room_id and gene.room_id in self.rooms_lookup:
                room_cap = self.rooms_lookup[gene.room_id]["room_capacity"]

                if gene.group_size > room_cap:
                    penalty += self.W_TOO_MUCH_STUDENTS
                else:
                    wasted = room_cap - gene.group_size
                    penalty += self.W_ROOM_SIZE * wasted

        return penalty

    def _build_profile_itinerary(self, chromosome: ScheduleChromosome) -> dict:
        """
        Helper function to build profile itineraries for fitness evaluation.
        :param chromosome: ScheduleChromosome to build itineraries for
        :return: Dictionary with profiles
        """
        profile_itinerary = {}
        for gene in chromosome.genes:
            if gene.timeslot_id is None:
                continue

            profiles_in_group = self.group_to_profiles.get(gene.group_id, [])
            for profile_id in profiles_in_group:
                if profile_id not in profile_itinerary:
                    profile_itinerary[profile_id] = []
                profile_itinerary[profile_id].append(gene)

        return profile_itinerary

    def _check_collisions(self, chromosome: ScheduleChromosome) -> float:
        """
        Helper function to check collisions
        :param chromosome: ScheduleChromosome to calculate fitness for
        :return: Penalty score (lower is better)
        """
        penalty = 0.0
        genes = chromosome.genes

        for i, value in enumerate(genes):
            for j in range(i + 1, len(genes)):
                if self._has_resource_conflict(value, genes[j]):
                    penalty += self.W_HARD_PENALTY

        return penalty

    def _is_time_overlap(self, g1: ClassSessionGene, g2: ClassSessionGene) -> bool:
        """
        Checks if two genes overlap in time (slots and weeks).
        :param g1: First Gene to check
        :param g2: Second Gene to check
        :return: True if they overlap, False otherwise
        """
        if g1.timeslot_id is None or g2.timeslot_id is None:
            return False

        if not (set(g1.active_weeks) & set(g2.active_weeks)):
            return False

        start1 = g1.timeslot_id
        end1 = start1 + g1.duration_slots

        start2 = g2.timeslot_id
        end2 = start2 + g2.duration_slots

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
        if not self._is_time_overlap(g1, g2):
            return False

        if g1.room_id == g2.room_id:
            return True

        if g1.instructor_id == g2.instructor_id:
            return True

        if g1.group_id == g2.group_id:
            return True

        if g2.group_id in self.conflicting_groups.get(g1.group_id, set()):
            return True

        return False

    def _evaluate_location_logic(self, chromosome: ScheduleChromosome) -> float:
        """
        Helper function to evaluate location logic (campuses, buildings) PER PROFILE
        :param chromosome: ScheduleChromosome to evaluate location logic for
        :return: Penalty score (lower is better)
        """
        penalty = 0.0
        profile_itinerary = self._build_profile_itinerary(chromosome)

        for profile_id, items in profile_itinerary.items():
            multiplier = self.profile_counts.get(profile_id, 1)
            sorted_genes = sorted(items, key=lambda x: x.timeslot_id)

            for k in range(len(sorted_genes) - 1):
                penalty += self._calculate_location_penalty(
                    sorted_genes[k], sorted_genes[k + 1], multiplier
                )

        return penalty

    def _should_skip_location_check(self, g1, g2) -> bool:
        """
        Checks if genes are on different days, lack rooms, or don't share weeks.
        :param g1: First Gene to check
        :param g2: Second Gene to check
        :return: True if genes are on different days, False otherwise
        """
        day1 = (g1.timeslot_id - 1) // 12
        day2 = (g2.timeslot_id - 1) // 12

        if day1 != day2:
            return True

        if not g1.room_id or not g2.room_id:
            return True

        weeks1 = getattr(g1, "active_weeks", None)
        weeks2 = getattr(g2, "active_weeks", None)
        if weeks1 is not None and weeks2 is not None:
            if not set(weeks1).intersection(weeks2):
                return True

        return False

    def _get_campus_change_penalty(self, gap: int, multiplier: int) -> float:
        """
        Calculates penalty for changing campus based on the available gap.
        :param gap: Gap to calculate penalty for
        :param multiplier: multiplier to calculate penalty for
        :return: Penalty score (lower is better)
        """
        if gap == 0:
            return self.W_CAMPUS_CHANGE * 2.0 * multiplier
        if gap == 1:
            return self.W_CAMPUS_CHANGE * 0.2 * multiplier

        return self.W_CAMPUS_CHANGE * 0.5 * multiplier

    def _calculate_location_penalty(self, g1, g2, multiplier: int) -> float:
        """
        Calculates location penalty for a pair of consecutive genes.
        :param g1: First Gene to calculate penalty for
        :param g2: Second Gene to calculate penalty for
        :param multiplier: multiplier to calculate penalty for
        :return: Penalty score (lower is better)
        """
        if self._should_skip_location_check(g1, g2):
            return 0.0

        finish_slot_g1 = g1.timeslot_id + getattr(g1, "duration_slots", 1)
        gap = g2.timeslot_id - finish_slot_g1

        r1 = self.rooms_lookup[g1.room_id]
        r2 = self.rooms_lookup[g2.room_id]

        if r1["campus_id"] != r2["campus_id"]:
            return self._get_campus_change_penalty(gap, multiplier)

        if r1["building_id"] != r2["building_id"]:
            return self.W_BUILDING_CHANGE * multiplier

        if g1.room_id != g2.room_id:
            return self.W_ROOM_CHANGE * multiplier

        return 0.0

    def _build_weekly_profile_itinerary(self, chromosome: ScheduleChromosome) -> dict:
        """
        Helper function to build profile itineraries mapped by week.
        :param chromosome: ScheduleChromosome to build profile itineraries for
        :return: Dictionary with profiles mapped by week
        """
        profile_itinerary = {}

        for gene in chromosome.genes:
            if gene.timeslot_id is None:
                continue

            profiles_in_group = self.group_to_profiles.get(gene.group_id, [])
            active_weeks = getattr(gene, "active_weeks", None)
            weeks = active_weeks if active_weeks else [None]

            for profile_id in profiles_in_group:
                if profile_id not in profile_itinerary:
                    profile_itinerary[profile_id] = {}

                for week in weeks:
                    if week not in profile_itinerary[profile_id]:
                        profile_itinerary[profile_id][week] = []
                    profile_itinerary[profile_id][week].append(gene)

        return profile_itinerary

    def _evaluate_time_efficiency(self, chromosome: ScheduleChromosome) -> float:
        """
        Helper function to evaluate time efficiency (days, gaps, fatigue) PER PROFILE
        :param chromosome: ScheduleChromosome to evaluate time efficiency for
        :return: float
        """
        penalty = 0.0
        profile_itinerary = self._build_weekly_profile_itinerary(chromosome)

        for profile_id, weeks_dict in profile_itinerary.items():
            multiplier = self.profile_counts.get(profile_id, 1)

            for _week, genes in weeks_dict.items():
                days_active = set((g.timeslot_id - 1) // 12 for g in genes)
                penalty += len(days_active) * self.W_DAY_USED * multiplier

                for day in days_active:
                    day_genes = sorted(
                        [g for g in genes if (g.timeslot_id - 1) // 12 == day],
                        key=lambda x: x.timeslot_id,
                    )
                    penalty += self._calculate_daily_penalty(day_genes, multiplier)

        return penalty

    def _calculate_daily_penalty(self, day_genes: list, multiplier: int) -> float:
        """
        Calculates gap and fatigue penalties for a single day of a profile.
        :param day_genes: list of genes for a single day
        :param multiplier: multiplier
        :return: float
        """
        penalty = 0.0
        daily_slots_count = 0

        for k, value in enumerate(day_genes):
            g = value
            daily_slots_count += g.duration_slots

            if k < len(day_genes) - 1:
                next_g = day_genes[k + 1]
                finish_slot_g = g.timeslot_id + getattr(g, "duration_slots", 1)
                gap = next_g.timeslot_id - finish_slot_g

                if gap > 0:
                    penalty += gap * self.W_GAP_SLOT * multiplier
                    if gap > 2:
                        penalty += self.W_MAX_GAP * multiplier

        if daily_slots_count > 6:
            penalty += (daily_slots_count - 6) * self.W_FATIGUE * multiplier

        return penalty
