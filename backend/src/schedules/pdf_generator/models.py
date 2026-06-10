import enum
from dataclasses import dataclass
from datetime import time


class Day(enum.Enum):
    MONDAY = 0
    TUESDAY = 1
    WEDNESDAY = 2
    THURSDAY = 3
    FRIDAY = 4

    @property
    def pl_name(self):
        return ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek"][self.value]


@dataclass
class Lesson:
    day: Day
    start_time: time
    end_time: time
    subject: str
    teacher: str
    room: str
    type_label: str = ""
    weeks: str = ""


@dataclass
class Schedule:
    title: str
    lessons: list[Lesson]
