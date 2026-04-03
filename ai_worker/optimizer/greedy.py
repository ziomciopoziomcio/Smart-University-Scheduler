from __future__ import annotations

from typing import List, Dict, Set, Tuple, Optional
import random

from .models import ClassSessionGene
from .fitness import SLOTS_PER_DAY, MAX_SLOT_ID

RoomsLookup = Dict[int, dict]
InstructorsLookup = Dict[int, dict]
CompetenciesMap = Dict[Tuple[int, str], Set[int]]
ConflictsMap = Dict[int, Set[int]]


def build_lookups(
    data: dict,
) -> tuple[RoomsLookup, InstructorsLookup, CompetenciesMap, ConflictsMap]:
    """
    Converts DataFrames in `data` into fast lookup dicts.
    Expects keys: rooms, employees, competencies, conflicting_groups (DataFrame).
    """
    rooms_lookup: RoomsLookup = data["rooms"].set_index("room_id").to_dict("index")
    instructors_lookup: InstructorsLookup = (
        data["employees"].set_index("id").to_dict("index")
    )

    competencies_map: CompetenciesMap = {}
    comp_df = data.get("competencies")
    if comp_df is not None and not comp_df.empty:
        for _, r in comp_df.iterrows():
            key = (int(r["course_code"]), r["class_type"])
            competencies_map.setdefault(key, set()).add(int(r["employee_id"]))

    conflicting_groups: ConflictsMap = {}
    conflicts_df = data.get("conflicting_groups")
    if conflicts_df is not None and not conflicts_df.empty:
        for a, b in zip(conflicts_df["group_a"], conflicts_df["group_b"]):
            a = int(a)
            b = int(b)
            conflicting_groups.setdefault(a, set()).add(b)
            conflicting_groups.setdefault(b, set()).add(a)

    return rooms_lookup, instructors_lookup, competencies_map, conflicting_groups


def _day(slot_id: int) -> int:
    return (slot_id - 1) // SLOTS_PER_DAY


def _slot_in_day(slot_id: int) -> int:
    return (slot_id - 1) % SLOTS_PER_DAY


def _iter_gene_weeks(gene: ClassSessionGene, pattern_index: int) -> list[int]:
    """
    Returns list of weeks for a given allowed pattern.
    If pattern is None -> assume standard semester weeks 1..15.
    If [] -> no scheduling possible.
    """
    if not gene.allowed_week_patterns:
        return []
    weeks = gene.allowed_week_patterns[pattern_index]
    if not weeks:
        return []
    if weeks is None:
        return list(range(1, 16))
    return list(weeks)


def _candidate_cost(
    gene: ClassSessionGene,
    start_slot: int,
    room_id: int,
    instr_id: int,
    weeks: list[int],
    rooms_lookup: RoomsLookup,
    occupied_group: set[tuple[int, int, int]],
    occupied_instr: set[tuple[int, int, int]],
) -> float:
    """
    Heuristic cost: lower is better. Not full fitness, but captures:
    - prefer earlier hours
    - minimize room waste
    - avoid late finishes
    - penalize inserting "in between" existing classes (simple gap penalty)
    """
    cost = 0.0

    duration = max(1, int(getattr(gene, "duration_slots", 1)))
    finish = start_slot + duration - 1

    #preference: earlier in day
    cost += 0.20 * _slot_in_day(start_slot)

    #minimize room waste
    cap = int(rooms_lookup[room_id].get("room_capacity", 0) or 0)
    cost += 0.05 * max(0, cap - int(gene.group_size))

    #penalize late finishes
    cost += 0.10 * max(0, _slot_in_day(finish) - 7)

    #gap penalty: if we schedule inside existing span for that day
    d = _day(start_slot)
    for w in weeks:
        group_taken = sorted(
            s
            for (ww, s, gid) in occupied_group
            if ww == w and gid == gene.group_id and _day(s) == d
        )
        if group_taken:
            if start_slot > group_taken[0] and finish < group_taken[-1]:
                cost += 5.0

        instr_taken = sorted(
            s
            for (ww, s, iid) in occupied_instr
            if ww == w and iid == instr_id and _day(s) == d
        )
        if instr_taken:
            if start_slot > instr_taken[0] and finish < instr_taken[-1]:
                cost += 7.5

    return cost


