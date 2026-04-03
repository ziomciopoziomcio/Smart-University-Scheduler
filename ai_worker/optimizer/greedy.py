from __future__ import annotations

from typing import List, Dict, Set, Tuple, Optional
from dataclasses import dataclass
import random

from .models import ClassSessionGene
from .fitness import SLOTS_PER_DAY, MAX_SLOT_ID

RoomsLookup = Dict[int, dict]
InstructorsLookup = Dict[int, dict]
CompetenciesMap = Dict[Tuple[int, str], Set[int]]
ConflictsMap = Dict[int, Set[int]]


@dataclass(frozen=True)
class GreedyContext:
    rooms_lookup: RoomsLookup
    instructors_lookup: InstructorsLookup
    competencies_map: CompetenciesMap
    conflicting_groups: ConflictsMap
    room_ids_sorted: list[int]
    randomize: bool


@dataclass
class Occupancy:
    occupied_room: set[tuple[int, int, int]]
    occupied_instr: set[tuple[int, int, int]]
    occupied_group: set[tuple[int, int, int]]


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


def _cost_early_start(start_slot: int) -> float:
    # preference: earlier in day
    return 0.20 * _slot_in_day(start_slot)


def _cost_room_waste(
    gene: ClassSessionGene, room_id: int, rooms_lookup: RoomsLookup
) -> float:
    cap = int(rooms_lookup[room_id].get("room_capacity", 0) or 0)
    return 0.05 * max(0, cap - int(gene.group_size))


def _cost_late_finish(start_slot: int, duration: int) -> float:
    finish = start_slot + duration - 1
    return 0.10 * max(0, _slot_in_day(finish) - 7)


def _taken_slots_for_day(
    occupied: set[tuple[int, int, int]],
    week: int,
    entity_id: int,
    day: int,
) -> list[int]:
    """
    occupied contains tuples (week, slot, entity_id) where entity_id is group_id or instructor_id.
    Returns sorted slots for the given (week, entity_id) that fall on the given day.
    """
    return sorted(
        s
        for (ww, s, eid) in occupied
        if ww == week and eid == entity_id and _day(s) == day
    )


def _cost_gap_penalty_for_day_span(
    start_slot: int,
    duration: int,
    taken_slots: list[int],
    penalty: float,
) -> float:
    """
    If (start..finish) is strictly inside existing [earliest..latest] span in that day,
    add a fixed penalty.
    """
    if not taken_slots:
        return 0.0

    finish = start_slot + duration - 1
    earliest = taken_slots[0]
    latest = taken_slots[-1]

    if start_slot > earliest and finish < latest:
        return penalty
    return 0.0


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
    duration = max(1, int(getattr(gene, "duration_slots", 1)))

    cost = 0.0
    cost += _cost_early_start(start_slot)
    cost += _cost_room_waste(gene, room_id, rooms_lookup)
    cost += _cost_late_finish(start_slot, duration)

    day = _day(start_slot)
    for w in weeks:
        group_taken = _taken_slots_for_day(
            occupied=occupied_group,
            week=w,
            entity_id=gene.group_id,
            day=day,
        )
        cost += _cost_gap_penalty_for_day_span(
            start_slot=start_slot,
            duration=duration,
            taken_slots=group_taken,
            penalty=5.0,
        )

        instr_taken = _taken_slots_for_day(
            occupied=occupied_instr,
            week=w,
            entity_id=instr_id,
            day=day,
        )
        cost += _cost_gap_penalty_for_day_span(
            start_slot=start_slot,
            duration=duration,
            taken_slots=instr_taken,
            penalty=7.5,
        )

    return cost


def _gene_priority(g: ClassSessionGene) -> tuple:
    equipment = (1 if g.pc_needed else 0) + (1 if g.projector_needed else 0)
    patterns = len(g.allowed_week_patterns or [])
    return -int(g.group_size), -int(g.duration_slots), -equipment, patterns


def _get_instructor_candidates(
    gene: ClassSessionGene,
    competencies_map: CompetenciesMap,
    instructors_lookup: InstructorsLookup,
    randomize: bool,
) -> list[int]:
    comp_key = (gene.course_code, gene.class_type)
    competent = list(competencies_map.get(comp_key, []))
    all_instr = list(instructors_lookup.keys())
    instr_candidates = competent or all_instr
    if randomize:
        random.shuffle(instr_candidates)
    return instr_candidates


def _room_satisfies_requirements(gene: ClassSessionGene, room: dict) -> bool:
    if int(room.get("room_capacity", 0) or 0) < int(gene.group_size):
        return False
    if gene.pc_needed and int(room.get("pc_amount", 0) or 0) <= 0:
        return False
    if gene.projector_needed and not bool(room.get("projector_availability", False)):
        return False
    return True


def _collect_candidate_rooms(
    gene: ClassSessionGene,
    room_ids_sorted: list[int],
    rooms_lookup: RoomsLookup,
) -> list[int]:
    return [
        rid
        for rid in room_ids_sorted
        if _room_satisfies_requirements(gene, rooms_lookup[rid])
    ]


def _maybe_shuffle(items: list[int], randomize: bool, probability: float = 0.2) -> None:
    if randomize and items and random.random() < probability:
        random.shuffle(items)


def _get_candidate_rooms(
    gene: ClassSessionGene,
    room_ids_sorted: list[int],
    rooms_lookup: RoomsLookup,
    randomize: bool,
) -> list[int]:
    candidate_rooms = _collect_candidate_rooms(gene, room_ids_sorted, rooms_lookup)
    _maybe_shuffle(candidate_rooms, randomize, probability=0.2)
    return candidate_rooms


def _pattern_indices(gene: ClassSessionGene, randomize: bool) -> list[int]:
    idxs = list(range(len(gene.allowed_week_patterns)))
    if randomize:
        random.shuffle(idxs)
    return idxs


def _slot_candidates(duration: int, randomize: bool) -> list[int]:
    slots = list(range(1, MAX_SLOT_ID - duration + 2))
    if randomize:
        slots = sorted(slots, key=lambda x: (_slot_in_day(x), random.random()))
    return slots


def _is_group_ok(
    gene: ClassSessionGene,
    weeks: list[int],
    start_slot: int,
    duration: int,
    occupied_group: set[tuple[int, int, int]],
    conflicting_groups: ConflictsMap,
) -> bool:
    # cannot cross day boundary already checked outside usually
    for w in weeks:
        for s in range(start_slot, start_slot + duration):
            if (w, s, gene.group_id) in occupied_group:
                return False
            for cg in conflicting_groups.get(gene.group_id, set()):
                if (w, s, cg) in occupied_group:
                    return False
    return True


def _is_room_ok(
    rid: int,
    weeks: list[int],
    start_slot: int,
    duration: int,
    occupied_room: set[tuple[int, int, int]],
) -> bool:
    for w in weeks:
        for s in range(start_slot, start_slot + duration):
            if (w, s, rid) in occupied_room:
                return False
    return True


def _is_instructor_ok(
    iid: int,
    weeks: list[int],
    start_slot: int,
    duration: int,
    occupied_instr: set[tuple[int, int, int]],
) -> bool:
    for w in weeks:
        for s in range(start_slot, start_slot + duration):
            if (w, s, iid) in occupied_instr:
                return False
    return True


def _best_for_weeks(
    gene: ClassSessionGene,
    *,
    weeks: list[int],
    pidx: int,
    duration: int,
    candidate_rooms: list[int],
    instr_candidates: list[int],
    ctx: GreedyContext,
    occ: Occupancy,
) -> Optional[tuple[float, int, int, int, int, list[int]]]:
    best: Optional[tuple[float, int, int, int, int, list[int]]] = None

    for start_slot in _slot_candidates(duration, ctx.randomize):
        if _slot_in_day(start_slot) + duration > SLOTS_PER_DAY:
            continue

        if not _is_group_ok(
            gene,
            weeks,
            start_slot,
            duration,
            occ.occupied_group,
            ctx.conflicting_groups,
        ):
            continue

        for rid in candidate_rooms:
            if not _is_room_ok(rid, weeks, start_slot, duration, occ.occupied_room):
                continue

            for iid in instr_candidates:
                if not _is_instructor_ok(
                    iid, weeks, start_slot, duration, occ.occupied_instr
                ):
                    continue

                cost = _candidate_cost(
                    gene=gene,
                    start_slot=start_slot,
                    room_id=rid,
                    instr_id=iid,
                    weeks=weeks,
                    rooms_lookup=ctx.rooms_lookup,
                    occupied_group=occ.occupied_group,
                    occupied_instr=occ.occupied_instr,
                )

                if best is None or cost < best[0]:
                    best = (cost, start_slot, rid, iid, pidx, weeks)

                if best is not None and best[0] <= 0.1 and not ctx.randomize:
                    return best

    return best


def _find_best_assignment_for_gene(
    gene: ClassSessionGene,
    *,
    ctx: GreedyContext,
    occ: Occupancy,
) -> Optional[tuple[int, int, int, int, list[int]]]:
    """
    Returns (start_slot, room_id, instructor_id, pattern_index, weeks) or None.
    """
    if not gene.allowed_week_patterns:
        return None

    duration = max(1, int(getattr(gene, "duration_slots", 1)))

    instr_candidates = _get_instructor_candidates(
        gene, ctx.competencies_map, ctx.instructors_lookup, ctx.randomize
    )
    candidate_rooms = _get_candidate_rooms(
        gene, ctx.room_ids_sorted, ctx.rooms_lookup, ctx.randomize
    )
    if not candidate_rooms:
        return None

    best: Optional[tuple[float, int, int, int, int, list[int]]] = None

    for pidx in _pattern_indices(gene, ctx.randomize):
        weeks = _iter_gene_weeks(gene, pidx)
        if not weeks:
            continue

        local_best = _best_for_weeks(
            gene,
            weeks=weeks,
            pidx=pidx,
            duration=duration,
            candidate_rooms=candidate_rooms,
            instr_candidates=instr_candidates,
            ctx=ctx,
            occ=occ,
        )
        if local_best is None:
            continue

        if best is None or local_best[0] < best[0]:
            best = local_best

        if best is not None and best[0] <= 0.1 and not ctx.randomize:
            break

    if best is None:
        return None

    _, start_slot, room_id, instr_id, pidx, weeks = best
    return start_slot, room_id, instr_id, pidx, weeks


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
    if seed is not None:
        random.seed(seed)

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
    )

    occ = Occupancy(
        occupied_room=set(),
        occupied_instr=set(),
        occupied_group=set(),
    )

    for gene in sorted(base_genes, key=_gene_priority):
        assignment = _find_best_assignment_for_gene(gene, ctx=ctx, occ=occ)
        if assignment is None:
            continue

        start_slot, room_id, instr_id, pidx, weeks = assignment
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
