from .models import ScheduleChromosome


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
                if g1.timeslot_id is not None and g1.timeslot_id == g2.timeslot_id:
                    shared_weeks = set(g1.active_weeks) & set(g2.active_weeks)
                    if shared_weeks:
                        is_group_conflict = (g1.group_id == g2.group_id) or (
                            g2.group_id
                            in self.conflicting_groups.get(g1.group_id, set())

                # Skip if any gene has no timeslot assigned
                if g1.timeslot_id is None or g2.timeslot_id is None:
                    continue

                # Only consider collisions in weeks where both genes are active
                shared_weeks = set(g1.active_weeks) & set(g2.active_weeks)
                if not shared_weeks:
                    continue

                # Compute occupied time intervals in slots (half-open [start, end))
                start1 = g1.timeslot_id
                duration1 = getattr(g1, "duration_slots", 1) or 1
                end1 = start1 + duration1

                start2 = g2.timeslot_id
                duration2 = getattr(g2, "duration_slots", 1) or 1
                end2 = start2 + duration2

                # Check if the time intervals overlap
                if start1 < end2 and start2 < end1:
                    is_group_conflict = (g1.group_id == g2.group_id) or (
                        g2.group_id
                        in self.conflicting_groups.get(g1.group_id, set())
                    )
                    if (
                        g1.room_id == g2.room_id
                        or g1.instructor_id == g2.instructor_id
                        or is_group_conflict
                    ):
                        penalty += self.W_HARD_PENALTY
        return penalty

    def _evaluate_location_logic(self, chromosome: ScheduleChromosome) -> float:
        """Helper function to evaluate location logic (campuses, buildings) PER STUDENT"""
        penalty = 0.0
        profile_itinerary = {}

        for gene in chromosome.genes:
            if gene.timeslot_id is None:
                continue
            profiles_in_group = self.group_to_profiles.get(gene.group_id, [])
            for profile_id in profiles_in_group:
                if profile_id not in profile_itinerary:
                    profile_itinerary[profile_id] = []
                profile_itinerary[profile_id].append(gene)

        for profile_id, items in profile_itinerary.items():
            multiplier = self.profile_counts.get(profile_id, 1)
            sorted_genes = sorted(items, key=lambda x: x.timeslot_id)

            for k in range(len(sorted_genes) - 1):
                g1 = sorted_genes[k]
                g2 = sorted_genes[k + 1]

                day1 = (g1.timeslot_id - 1) // 12
                day2 = (g2.timeslot_id - 1) // 12

                if day1 != day2:
                    continue

                # Ensure we only penalize location changes between classes
                # that can actually co-occur in at least one active week.
                weeks1 = getattr(g1, "active_weeks", None)
                weeks2 = getattr(g2, "active_weeks", None)
                if weeks1 is not None and weeks2 is not None:
                    if not set(weeks1).intersection(weeks2):
                        # These classes never run in the same week for this profile.
                        # Skip applying any location-change penalty between them.
                        continue
                finish_slot_g1 = g1.timeslot_id + g1.duration_slots
                gap = g2.timeslot_id - finish_slot_g1

                if not g1.room_id or not g2.room_id:
                    continue

                r1 = self.rooms_lookup[g1.room_id]
                r2 = self.rooms_lookup[g2.room_id]

                if r1["campus_id"] != r2["campus_id"]:
                    if gap == 0:
                        penalty += self.W_CAMPUS_CHANGE * 2.0 * multiplier
                    elif gap == 1:
                        penalty += self.W_CAMPUS_CHANGE * 0.2 * multiplier
                    else:
                        penalty += self.W_CAMPUS_CHANGE * 0.5 * multiplier

                elif r1["building_id"] != r2["building_id"]:
                    penalty += self.W_BUILDING_CHANGE * multiplier

                elif g1.room_id != g2.room_id:
                    penalty += self.W_ROOM_CHANGE * multiplier

        return penalty

    def _evaluate_time_efficiency(self, chromosome: ScheduleChromosome) -> float:
        """Helper function to evaluate time efficiency (days, gaps, fatigue) PER PROFILE"""
        penalty = 0.0
        # profile_itinerary maps: profile_id -> {week_identifier -> [genes]}
        profile_itinerary = {}

        for gene in chromosome.genes:
            if gene.timeslot_id is None:
                continue
            profiles_in_group = self.group_to_profiles.get(gene.group_id, [])
            # Determine the weeks in which this gene is active. If no explicit
            # active_weeks information is available, fall back to a single
            # synthetic week bucket (None) to preserve existing behavior.
            active_weeks = getattr(gene, "active_weeks", None)
            if not active_weeks:
                weeks = [None]
            else:
                weeks = active_weeks
            for profile_id in profiles_in_group:
                if profile_id not in profile_itinerary:
                    profile_itinerary[profile_id] = {}
                for week in weeks:
                    if week not in profile_itinerary[profile_id]:
                        profile_itinerary[profile_id][week] = []
                    profile_itinerary[profile_id][week].append(gene)

        for profile_id, weeks_dict in profile_itinerary.items():
            multiplier = self.profile_counts.get(profile_id, 1)
            for _week, genes in weeks_dict.items():
                # Compute days, gaps and fatigue within this week only, so that
                # sessions that never occur in the same week do not interact.
                days_active = set((g.timeslot_id - 1) // 12 for g in genes)
                penalty += len(days_active) * self.W_DAY_USED * multiplier

                for day in days_active:
                    day_genes = sorted(
                        [g for g in genes if (g.timeslot_id - 1) // 12 == day],
                        key=lambda x: x.timeslot_id,
                    )

                    daily_slots_count = 0
                    for k in range(len(day_genes)):
                        g = day_genes[k]
                        daily_slots_count += g.duration_slots

                        if k < len(day_genes) - 1:
                            next_g = day_genes[k + 1]
                            finish_slot_g = g.timeslot_id + g.duration_slots
                            gap = next_g.timeslot_id - finish_slot_g

                            if gap > 0:
                                penalty += gap * self.W_GAP_SLOT * multiplier
                                if gap > 2:
                                    penalty += self.W_MAX_GAP * multiplier

                    if daily_slots_count > 6:
                        penalty += (daily_slots_count - 6) * self.W_FATIGUE * multiplier

        return penalty
