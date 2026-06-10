from collections import defaultdict
from datetime import time
import logging

from src.schedules.pdf_generator.models import Lesson, Day
from src.schedules.schemas import ScheduleEntryWithWeekNumber

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


class ScheduleAdapter:
    @staticmethod
    def parse_time(t: str) -> time:
        h, m = map(int, t.split(":"))
        return time(h, m)

    @staticmethod
    def variant_to_label(v) -> str:
        if not v:
            return ""

        val_str = (v.name if hasattr(v, "name") else str(v)).upper()

        mappings = {
            "w": ["LECTURE", "WYKŁAD"],
            "l": ["LABORATORY", "LAB"],
            "ć": ["TUTORIALS", "ĆWICZENIA"],
            "e": ["E-LEARNING", "ONLINE"],
        }

        for label, keywords in mappings.items():
            if any(kw in val_str for kw in keywords):
                return label

        return val_str.split(".")[-1]

    @staticmethod
    def _format_week_ranges(weeks: list[int]) -> str:
        """Helper to convert a sorted list of weeks into a comma-separated range string."""
        ranges = []
        start = prev = weeks[0]

        for n in weeks[1:]:
            if n == prev + 1:
                prev = n
            else:
                ranges.append(f"{start}" if start == prev else f"{start}-{prev}")
                start = prev = n

        ranges.append(f"{start}" if start == prev else f"{start}-{prev}")
        return ", ".join(ranges)

    @staticmethod
    def weeks_to_string(weeks: list[int]) -> str:
        if not weeks:
            return "Tygodnie: "

        w = sorted(set(int(x) for x in weeks))

        if w == list(range(1, 16, 2)):
            return "Tygodnie: np."
        if w == list(range(2, 16, 2)):
            return "Tygodnie: p."

        return f"Tygodnie: {ScheduleAdapter._format_week_ranges(w)}"

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
            room,
            teacher,
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
