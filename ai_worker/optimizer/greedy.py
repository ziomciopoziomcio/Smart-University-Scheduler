from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, TypeAlias
import secrets

from .models import ClassSessionGene

RoomsLookup = dict[int, dict]
InstructorsLookup = dict[int, dict]
CompetenciesMap = dict[tuple[int, str], set[int]]
ConflictsMap = dict[int, set[int]]

# (cost, start_slot, room_id, instr_id, pattern_index, weeks)
BestTuple: TypeAlias = tuple[float, int, int, int, int, list[int]]


@dataclass(frozen=True)
class GreedyContext:
    rooms_lookup: RoomsLookup
    instructors_lookup: InstructorsLookup
    competencies_map: CompetenciesMap
    conflicting_groups: ConflictsMap
    room_ids_sorted: list[int]
    randomize: bool
    rng: secrets.SystemRandom


@dataclass
class Occupancy:
    occupied_room: set[tuple[int, int, int]]
    occupied_instr: set[tuple[int, int, int]]
    occupied_group: set[tuple[int, int, int]]


@dataclass(frozen=True)
class StartSlotInput:
    gene: ClassSessionGene
    weeks: list[int]
    pattern_index: int
    start_slot: int
    duration: int
    candidate_rooms: list[int]
    instr_candidates: list[int]


@dataclass(frozen=True)
class EvalInput:
    gene: ClassSessionGene
    weeks: list[int]
    pattern_index: int
    start_slot: int
    duration: int
    feasible_rooms: list[int]
    feasible_instr: list[int]


def build_lookups(
    data: dict,
) -> tuple[RoomsLookup, InstructorsLookup, CompetenciesMap, ConflictsMap]:
    """
    Converts DataFrames in `data` into fast lookup dicts.

    Expects keys:
    - rooms (DataFrame with room_id)
    - employees (DataFrame with id)
    - competencies (DataFrame with employee_id, course_code, class_type) [optional]
    - conflicting_groups (DataFrame with group_a, group_b) [optional]
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


def _gene_priority(g: ClassSessionGene) -> tuple:
    equipment = (1 if g.pc_needed else 0) + (1 if g.projector_needed else 0)
    patterns = len(g.allowed_week_patterns or [])
    return (
        -int(g.group_size),
        -int(getattr(g, "duration_slots", 1)),
        -equipment,
        patterns,
    )


def _apply_assignment(
    gene: ClassSessionGene,
    *,
    start_slot: int,
    room_id: int,
    instr_id: int,
    pattern_index: int,
    weeks: list[int],
    occ: Occupancy,
) -> None:
    duration = max(1, int(getattr(gene, "duration_slots", 1)))

    gene.timeslot_id = start_slot
    gene.room_id = room_id
    gene.instructor_id = instr_id
    gene.selected_pattern_index = pattern_index

    for w in weeks:
        for s in range(start_slot, start_slot + duration):
            occ.occupied_room.add((w, s, room_id))
            occ.occupied_instr.add((w, s, instr_id))
            occ.occupied_group.add((w, s, gene.group_id))


def greedy_assign(
    base_genes: List[ClassSessionGene],
    data: dict,
    randomize: bool = False,
    seed: Optional[int] = None,
) -> List[ClassSessionGene]:
    """
    Greedy assignment used for seeding population.

    Note on randomness:
    - When randomize=False, algorithm is deterministic without needing any RNG.
    - When randomize=True, we use SystemRandom() (cryptographically secure).
    - `seed` is kept for API compatibility but not used with SystemRandom.
    """
    _ = seed  # kept intentionally for compatibility

    from .greedy_search import (
        find_best_assignment_for_gene,
    )  # local import to avoid cycles

    rooms_lookup, instructors_lookup, competencies_map, conflicting_groups = (
        build_lookups(data)
    )

    room_ids_sorted = sorted(
        rooms_lookup.keys(),
        key=lambda rid: rooms_lookup[rid].get("room_capacity", 0) or 0,
    )

    ctx = GreedyContext(
        rooms_lookup=rooms_lookup,
        instructors_lookup=instructors_lookup,
        competencies_map=competencies_map,
        conflicting_groups=conflicting_groups,
        room_ids_sorted=room_ids_sorted,
        randomize=randomize,
        rng=secrets.SystemRandom(),
    )

    occ = Occupancy(occupied_room=set(), occupied_instr=set(), occupied_group=set())

    for gene in sorted(base_genes, key=_gene_priority):
        best = find_best_assignment_for_gene(gene, ctx=ctx, occ=occ)
        if best is None:
            continue

        _, start_slot, room_id, instr_id, pidx, weeks = best
        _apply_assignment(
            gene,
            start_slot=start_slot,
            room_id=room_id,
            instr_id=instr_id,
            pattern_index=pidx,
            weeks=weeks,
            occ=occ,
        )

    return base_genes
