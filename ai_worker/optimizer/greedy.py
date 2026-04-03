from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional, Set, Tuple, TypeAlias
import secrets

from .fitness import MAX_SLOT_ID, SLOTS_PER_DAY
from .models import ClassSessionGene

RoomsLookup = Dict[int, dict]
InstructorsLookup = Dict[int, dict]
CompetenciesMap = Dict[Tuple[int, str], Set[int]]
ConflictsMap = Dict[int, Set[int]]

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


def _gene_priority(g: ClassSessionGene) -> tuple:
    equipment = (1 if g.pc_needed else 0) + (1 if g.projector_needed else 0)
    patterns = len(g.allowed_week_patterns or [])
    return (
        -int(g.group_size),
        -int(getattr(g, "duration_slots", 1)),
        -equipment,
        patterns,
    )


def _cost_early_start(start_slot: int) -> float:
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
    duration = max(1, int(getattr(gene, "duration_slots", 1)))

    cost = 0.0
    cost += _cost_early_start(start_slot)
    cost += _cost_room_waste(gene, room_id, rooms_lookup)
    cost += _cost_late_finish(start_slot, duration)

    day = _day(start_slot)
    for w in weeks:
        group_taken = _taken_slots_for_day(
            occupied=occupied_group, week=w, entity_id=gene.group_id, day=day
        )
        cost += _cost_gap_penalty_for_day_span(
            start_slot=start_slot,
            duration=duration,
            taken_slots=group_taken,
            penalty=5.0,
        )

        instr_taken = _taken_slots_for_day(
            occupied=occupied_instr, week=w, entity_id=instr_id, day=day
        )
        cost += _cost_gap_penalty_for_day_span(
            start_slot=start_slot,
            duration=duration,
            taken_slots=instr_taken,
            penalty=7.5,
        )

    return cost


def _pattern_indices(gene: ClassSessionGene, ctx: GreedyContext) -> list[int]:
    idxs = list(range(len(gene.allowed_week_patterns)))
    if ctx.randomize:
        ctx.rng.shuffle(idxs)
    return idxs


def _get_instructor_candidates(gene: ClassSessionGene, ctx: GreedyContext) -> list[int]:
    comp_key = (gene.course_code, gene.class_type)
    competent = list(ctx.competencies_map.get(comp_key, []))
    all_instr = list(ctx.instructors_lookup.keys())
    instr_candidates = competent or all_instr
    if ctx.randomize:
        ctx.rng.shuffle(instr_candidates)
    return instr_candidates


def _room_satisfies_requirements(gene: ClassSessionGene, room: dict) -> bool:
    if int(room.get("room_capacity", 0) or 0) < int(gene.group_size):
        return False
    if gene.pc_needed and int(room.get("pc_amount", 0) or 0) <= 0:
        return False
    if gene.projector_needed and not bool(room.get("projector_availability", False)):
        return False
    return True


def _collect_candidate_rooms(gene: ClassSessionGene, ctx: GreedyContext) -> list[int]:
    return [
        rid
        for rid in ctx.room_ids_sorted
        if _room_satisfies_requirements(gene, ctx.rooms_lookup[rid])
    ]


def _maybe_shuffle(
    items: list[int], ctx: GreedyContext, probability: float = 0.2
) -> None:
    if ctx.randomize and items and ctx.rng.random() < probability:
        ctx.rng.shuffle(items)


def _get_candidate_rooms(gene: ClassSessionGene, ctx: GreedyContext) -> list[int]:
    candidate_rooms = _collect_candidate_rooms(gene, ctx)
    _maybe_shuffle(candidate_rooms, ctx, probability=0.2)
    return candidate_rooms


def _is_group_ok(
    gene: ClassSessionGene,
    weeks: list[int],
    start_slot: int,
    duration: int,
    occupied_group: set[tuple[int, int, int]],
    conflicting_groups: ConflictsMap,
) -> bool:
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


def _iter_feasible_start_slots(duration: int, ctx: GreedyContext) -> list[int]:
    slots = list(range(1, MAX_SLOT_ID - duration + 2))
    if ctx.randomize:
        slots = sorted(slots, key=lambda x: (_slot_in_day(x), ctx.rng.random()))
    return slots


def _is_start_slot_valid_for_day_boundary(start_slot: int, duration: int) -> bool:
    return _slot_in_day(start_slot) + duration <= SLOTS_PER_DAY


def _iter_feasible_rooms(
    candidate_rooms: list[int],
    weeks: list[int],
    start_slot: int,
    duration: int,
    occ: Occupancy,
) -> list[int]:
    return [
        rid
        for rid in candidate_rooms
        if _is_room_ok(rid, weeks, start_slot, duration, occ.occupied_room)
    ]


def _iter_feasible_instructors(
    instr_candidates: list[int],
    weeks: list[int],
    start_slot: int,
    duration: int,
    occ: Occupancy,
) -> list[int]:
    return [
        iid
        for iid in instr_candidates
        if _is_instructor_ok(iid, weeks, start_slot, duration, occ.occupied_instr)
    ]


def _update_best(
    best: Optional[BestTuple], cand: BestTuple
) -> tuple[Optional[BestTuple], bool]:
    if best is None or cand[0] < best[0]:
        return cand, True
    return best, False


def _evaluate_candidates_for_start_slot(
    inp: EvalInput,
    *,
    ctx: GreedyContext,
    occ: Occupancy,
) -> Optional[BestTuple]:
    best_local: Optional[BestTuple] = None

    for rid in inp.feasible_rooms:
        for iid in inp.feasible_instr:
            cost = _candidate_cost(
                gene=inp.gene,
                start_slot=inp.start_slot,
                room_id=rid,
                instr_id=iid,
                weeks=inp.weeks,
                rooms_lookup=ctx.rooms_lookup,
                occupied_group=occ.occupied_group,
                occupied_instr=occ.occupied_instr,
            )
            cand: BestTuple = (
                cost,
                inp.start_slot,
                rid,
                iid,
                inp.pattern_index,
                inp.weeks,
            )
            best_local, _ = _update_best(best_local, cand)

            if best_local is not None and best_local[0] <= 0.1 and not ctx.randomize:
                return best_local

    return best_local


def _best_for_start_slot(
    inp: StartSlotInput,
    *,
    ctx: GreedyContext,
    occ: Occupancy,
) -> Optional[BestTuple]:
    """
    For a fixed (weeks, pattern_index, start_slot) compute best candidate among rooms/instructors.
    """
    feasible_rooms = _iter_feasible_rooms(
        inp.candidate_rooms,
        inp.weeks,
        inp.start_slot,
        inp.duration,
        occ,
    )
    if not feasible_rooms:
        return None

    feasible_instr = _iter_feasible_instructors(
        inp.instr_candidates,
        inp.weeks,
        inp.start_slot,
        inp.duration,
        occ,
    )
    if not feasible_instr:
        return None

    eval_inp = EvalInput(
        gene=inp.gene,
        weeks=inp.weeks,
        pattern_index=inp.pattern_index,
        start_slot=inp.start_slot,
        duration=inp.duration,
        feasible_rooms=feasible_rooms,
        feasible_instr=feasible_instr,
    )
    return _evaluate_candidates_for_start_slot(eval_inp, ctx=ctx, occ=occ)


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
) -> Optional[BestTuple]:
    best: Optional[BestTuple] = None

    for start_slot in _iter_feasible_start_slots(duration, ctx):
        if not _is_start_slot_valid_for_day_boundary(start_slot, duration):
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

        slot_inp = StartSlotInput(
            gene=gene,
            weeks=weeks,
            pattern_index=pidx,
            start_slot=start_slot,
            duration=duration,
            candidate_rooms=candidate_rooms,
            instr_candidates=instr_candidates,
        )
        local_best = _best_for_start_slot(slot_inp, ctx=ctx, occ=occ)
        if local_best is None:
            continue

        best, _ = _update_best(best, local_best)

        if best is not None and best[0] <= 0.1 and not ctx.randomize:
            break

    return best


def _best_over_patterns(
    gene: ClassSessionGene,
    *,
    duration: int,
    candidate_rooms: list[int],
    instr_candidates: list[int],
    ctx: GreedyContext,
    occ: Occupancy,
) -> Optional[BestTuple]:
    best: Optional[BestTuple] = None

    for pidx in _pattern_indices(gene, ctx):
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

        best, _ = _update_best(best, local_best)

        if best is not None and best[0] <= 0.1 and not ctx.randomize:
            break

    return best


def _find_best_assignment_for_gene(
    gene: ClassSessionGene,
    *,
    ctx: GreedyContext,
    occ: Occupancy,
) -> Optional[tuple[int, int, int, int, list[int]]]:
    if not gene.allowed_week_patterns:
        return None

    duration = max(1, int(getattr(gene, "duration_slots", 1)))

    instr_candidates = _get_instructor_candidates(gene, ctx)
    candidate_rooms = _get_candidate_rooms(gene, ctx)
    if not candidate_rooms:
        return None

    best = _best_over_patterns(
        gene,
        duration=duration,
        candidate_rooms=candidate_rooms,
        instr_candidates=instr_candidates,
        ctx=ctx,
        occ=occ,
    )
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
    """
    Greedy assignment used for seeding population.

    Hard constraints:
    - no collision for room/instructor/group in overlapping (week, slot)
    - no collision with conflicting groups
    - room capacity + equipment
    - class cannot cross day boundary

    Note on randomness:
    - When randomize=False, algorithm is deterministic without needing any RNG.
    - When randomize=True, we use SystemRandom() (cryptographically secure).
    - `seed` is kept for API compatibility but not used with SystemRandom.
    """
    _ = seed  # kept intentionally for compatibility

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
