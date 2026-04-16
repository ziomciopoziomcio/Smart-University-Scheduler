from datetime import date

from sqlalchemy.orm import Session

from backend.src.academics.models import Academic_calendar, SemesterType


def _get_2025_2026_summer_days() -> list[list[date]]:
    """
    Generates 2025/2026 summer days
    :return: list of weeks with dates
    """
    week_01: list[date] = [
        date(2026, 3, 2),
        date(2026, 3, 3),
        date(2026, 3, 4),
        date(2026, 3, 5),
        date(2026, 3, 6),
    ]

    week_02: list[date] = [
        date(2026, 3, 9),
        date(2026, 3, 10),
        date(2026, 3, 11),
        date(2026, 3, 12),
        date(2026, 3, 13),
    ]

    week_03: list[date] = [
        date(2026, 3, 16),
        date(2026, 3, 17),
        date(2026, 3, 18),
        date(2026, 3, 19),
        date(2026, 3, 20),
    ]

    week_04: list[date] = [
        date(2026, 3, 23),
        date(2026, 3, 24),
        date(2026, 3, 25),
        date(2026, 3, 26),
        date(2026, 3, 27),
    ]

    week_05: list[date] = [
        date(2026, 3, 30),
        date(2026, 4, 14),
        date(2026, 4, 8),
        date(2026, 3, 31),
        date(2026, 4, 1),
    ]

    week_06: list[date] = [
        date(2026, 4, 13),
        date(2026, 4, 21),
        date(2026, 4, 15),
        date(2026, 4, 9),
        date(2026, 4, 10),
    ]

    week_07: list[date] = [
        date(2026, 4, 20),
        date(2026, 4, 28),
        date(2026, 4, 22),
        date(2026, 4, 16),
        date(2026, 4, 17),
    ]

    week_08: list[date] = [
        date(2026, 5, 4),
        date(2026, 5, 5),
        date(2026, 4, 29),
        date(2026, 4, 23),
        date(2026, 4, 24),
    ]

    week_09: list[date] = [
        date(2026, 5, 11),
        date(2026, 5, 12),
        date(2026, 5, 6),
        date(2026, 4, 30),
        date(2026, 4, 27),
    ]

    week_10: list[date] = [
        date(2026, 5, 18),
        date(2026, 5, 19),
        date(2026, 5, 13),
        date(2026, 5, 7),
        date(2026, 5, 8),
    ]

    week_11: list[date] = [
        date(2026, 5, 25),
        date(2026, 5, 26),
        date(2026, 5, 20),
        date(2026, 5, 14),
        date(2026, 5, 15),
    ]

    week_12: list[date] = [
        date(2026, 6, 1),
        date(2026, 6, 2),
        date(2026, 5, 27),
        date(2026, 5, 21),
        date(2026, 5, 22),
    ]

    week_13: list[date] = [
        date(2026, 6, 8),
        date(2026, 6, 9),
        date(2026, 6, 3),
        date(2026, 5, 28),
        date(2026, 5, 29),
    ]

    week_14: list[date] = [
        date(2026, 6, 15),
        date(2026, 6, 16),
        date(2026, 6, 10),
        date(2026, 6, 11),
        date(2026, 6, 12),
    ]

    week_15: list[date] = [
        date(2026, 6, 22),
        date(2026, 6, 23),
        date(2026, 6, 17),
        date(2026, 6, 18),
        date(2026, 6, 19),
    ]

    weeks: list[list[date]] = [
        week_01,
        week_02,
        week_03,
        week_04,
        week_05,
        week_06,
        week_07,
        week_08,
        week_09,
        week_10,
        week_11,
        week_12,
        week_13,
        week_14,
        week_15,
    ]

    return weeks


def _are_duplicates(weeks: list[list[date]]) -> bool:
    """
    Checks if there are duplicate dates
    :param weeks: list of weeks
    :return: True if there are duplicate dates, else False
    """
    all_dates = [d for week in weeks for d in week]

    duplicates = set([d for d in all_dates if all_dates.count(d) > 1])

    if duplicates:
        # print("Duplicates found:")
        # for d in sorted(duplicates):
        #     print(d)
        return True
    else:
        return False


def _add_day_to_db(
    session: Session,
    calendar_date: date,
    academic_year: str,
    semester_type: SemesterType,
    week_number: int,
    academic_day_of_week: int,
    description: str | None,
) -> Academic_calendar:
    """
    Adds Academic_calendar object to database
    :param session: database session
    :param calendar_date: date object
    :param academic_year: string representing academic year
    :param semester_type: enum representing semester type
    :param week_number: week number
    :param academic_day_of_week: number representing day of week
    :param description: description of the day
    :return: Academic_calendar object
    """
    ac_obj = Academic_calendar(
        calendar_date=calendar_date,
        academic_year=academic_year,
        semester_type=semester_type,
        week_number=week_number,
        academic_day_of_week=academic_day_of_week,
        description=description,
    )
    session.add(ac_obj)
    return ac_obj


def generate_academic_calendar(
    session: Session,
) -> dict[date, Academic_calendar] | None:
    """
    Generates Academic_calendar objects
    :param session: database session
    :return: added Academic_calendar objects
        or None if incorrect data
    """
    db_academic_calendar: dict[date, Academic_calendar] = {}
    academic_year = "2025/2026"
    semester_type = SemesterType.SUMMER
    week_number = 1
    description = None
    weeks = _get_2025_2026_summer_days()
    if _are_duplicates(weeks):
        print("Incorrect data!")
        return None

    day_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    day_of_week_idx = 0

    for week in weeks:
        for day in week:
            academic_day_of_week = day_of_week[day_of_week_idx]
            print(day, academic_day_of_week, week_number)
            # add to db
            added_obj = _add_day_to_db(
                session=session,
                calendar_date=day,
                academic_year=academic_year,
                semester_type=semester_type,
                week_number=week_number,
                academic_day_of_week=day_of_week_idx + 1,
                description=description,
            )
            db_academic_calendar[day] = added_obj

            # update counters
            day_of_week_idx += 1
            if day_of_week_idx >= 5:
                day_of_week_idx = 0
                week_number += 1

    session.flush()
    return db_academic_calendar
