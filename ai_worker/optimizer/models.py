from dataclasses import dataclass, field


@dataclass
class ClassSessionGene:
    """Represents a gene for a class session in the genetic algorithm."""

    course_code: int
    class_type: str
    group_id: int
    duration_slots: int
    pc_needed: bool
    projector_needed: bool
    group_size: int

    allowed_week_patterns: list[list[int]] = field(default_factory=list)

    timeslot_id: int | None = None
    room_id: int | None = None
    instructor_id: int | None = None
    selected_pattern_index: int = 0

    @property
    def active_weeks(self) -> list[int]:
        """
        Returns a list of all active weeks in the schedule.
        :return: List of all active weeks in the schedule.
        """
        if not self.allowed_week_patterns:
            return []
        idx = self.selected_pattern_index % len(self.allowed_week_patterns)
        return self.allowed_week_patterns[idx]


@dataclass
class ScheduleChromosome:
    """Represents a chromosome for a schedule in the genetic algorithm"""

    genes: list[ClassSessionGene] = field(default_factory=list)

    fitness_score: float = float("inf")
