from collections import defaultdict
from datetime import time

from src.schedules.pdf_generator.models import Lesson, Day
from src.schedules.schemas import *


def group_schedule_by_weeks(
    entries: list[ScheduleEntryWithWeekNumber],
) -> dict:
    grouped = defaultdict(list)

    for entry in entries:
        key = (
            entry.id,
            entry.title,
            entry.start_time,
            entry.end_time,
            entry.variant,
            entry.academic_day_of_week,
            entry.room_name,
            entry.instructor_name,
        )

        grouped[key].append(entry.week_number)

    return {key: sorted(set(weeks)) for key, weeks in grouped.items()}
    # np: (('1', 'Matematyka', '08:00', '09:30', <ClassType.LECTURE: 'Lecture'>, 1), [1,3,5,7])
    # np: (('id', 'title', 'start', 'end', variant, ACADEMICDayOfWeek), [weeks])


class ScheduleAdapter:
    @staticmethod
    def parse_time(t: str) -> time:
        h, m = map(int, t.split(":"))
        return time(h, m)

    @staticmethod
    def variant_to_label(v) -> str:
        return v.value if hasattr(v, "value") else str(v)

    @staticmethod
    def weeks_to_string(weeks: list[int]) -> str:
        return "Tygodnie: " + ", ".join(map(str, weeks))

    @staticmethod
    def build_lessons(entries: list[ScheduleEntryWithWeekNumber]) -> list[Lesson]:
        grouped = group_schedule_by_weeks(entries)

        lessons: list[Lesson] = []

        for (
            id_,
            title,
            start,
            end,
            variant,
            day,
            teacher,
            room,
        ), weeks in grouped.items():
            lessons.append(
                Lesson(
                    day=Day(day),
                    start_time=ScheduleAdapter.parse_time(start),
                    end_time=ScheduleAdapter.parse_time(end),
                    subject=title,
                    teacher=teacher,
                    room=room,
                    type_label=ScheduleAdapter.variant_to_label(variant),
                    weeks=ScheduleAdapter.weeks_to_string(weeks),
                )
            )

        return lessons
