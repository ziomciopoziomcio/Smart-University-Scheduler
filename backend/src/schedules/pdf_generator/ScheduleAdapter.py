from collections import defaultdict
from datetime import time
import logging

from src.schedules.pdf_generator.models import Lesson, Day
from src.schedules.schemas import *

logger = logging.getLogger(__name__)


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
        if not v:
            return ""

        val_str = v.name if hasattr(v, "name") else str(v)
        val_str = val_str.upper()

        if "LECTURE" in val_str or "WYKŁAD" in val_str:
            return "w"
        if "LABORATORY" in val_str or "LAB" in val_str:
            return "l"
        if "TUTORIALS" in val_str or "ĆWICZENIA" in val_str:
            return "ć"

        return val_str.split(".")[-1]

    @staticmethod
    def weeks_to_string(weeks: list[int]) -> str:
        """
        Convert a sorted list of week numbers into a compact string:
        e.g. [1,2,3,4,5,6,7,8] -> "Tygodnie: 1-8"
              [1,2,3,5,6,7,9] -> "Tygodnie: 1-3, 5-7, 9"

        Special cases:
        - if weeks == [1,3,5,...,15] -> "Tygodnie: np." (all odd weeks 1..15)
        - if weeks == [2,4,6,...,14] -> "Tygodnie: p." (all even weeks 1..15)
        """
        if not weeks:
            return "Tygodnie: "

        w = sorted(set(int(x) for x in weeks))

        full_odds_1_15 = list(range(1, 16, 2))  # [1,3,5,...,15]
        full_evens_1_15 = list(range(2, 16, 2))  # [2,4,6,...,14]

        if w == full_odds_1_15:
            return "Tygodnie: np."
        if w == full_evens_1_15:
            return "Tygodnie: p."

        ranges = []
        start = prev = w[0]

        for n in w[1:]:
            if n == prev + 1:
                prev = n
                continue
            else:
                if start == prev:
                    ranges.append(f"{start}")
                else:
                    ranges.append(f"{start}-{prev}")
                start = prev = n

        if start == prev:
            ranges.append(f"{start}")
        else:
            ranges.append(f"{start}-{prev}")

        return "Tygodnie: " + ", ".join(ranges)

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

            try:
                day_index = int(day) - 1
            except Exception:
                logger.warning(
                    "Invalid academic day value for session %s: %s", id_, day
                )
                continue

            if day_index < 0 or day_index > 4:
                logger.info(
                    "Skipping session %s (%s) on weekend or out-of-range day: %s",
                    id_,
                    title,
                    day,
                )
                continue

            try:
                day_enum = Day(day_index)
            except Exception:
                logger.warning(
                    "Could not map day index to Day enum for session %s: %s",
                    id_,
                    day_index,
                )
                continue

            lessons.append(
                Lesson(
                    day=day_enum,
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
