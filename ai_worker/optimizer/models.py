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

    timeslot_id: int | None = None
    room_id: int | None = None
    instructor_id: int | None = None


@dataclass
class ScheduleChromosome:
    """Represents a chromosome for a schedule in the genetic algorithm"""

    genes: list[ClassSessionGene] = field(default_factory=list)

    fitness_score: float = 0.0
