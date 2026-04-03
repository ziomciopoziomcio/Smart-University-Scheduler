from __future__ import annotations

from typing import Optional

from .fitness import MAX_SLOT_ID, SLOTS_PER_DAY
from .models import ClassSessionGene
from .greedy import (
    BestTuple,
    ConflictsMap,
    EvalInput,
    GreedyContext,
    Occupancy,
    RoomsLookup,
    StartSlotInput,
)


def _day(slot_id: int) -> int:
    return (slot_id - 1) // SLOTS_PER_DAY


def _slot_in_day(slot_id: int) -> int:
    return (slot_id - 1) % SLOTS_PER_DAY


def _iter_gene_weeks(gene: ClassSessionGene, pattern_index: int) -> list[int]:
    if not gene.allowed_week_patterns:
        return []
    weeks = gene.allowed_week_patterns[pattern_index]
    if weeks is None:
        return list(range(1, 16))
    if not weeks:
        return []
    return list(weeks)


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


def _taken_slots_for_day_indexed(
    occ: Occupancy,
    week: int,
    entity_id: int,
    day: int,
    entity_type: str,
) -> list[int]:
    """
    Fast retrieval of slot_in_day list for given (week, entity_id, day).
    entity_type in {"group", "instr", "room"}.
    Returns a sorted list (may be empty).
    """
    if entity_type == "group":
        return occ.taken_slots_for_group_day(week, entity_id, day)
    if entity_type == "instr":
        return occ.taken_slots_for_instr_day(week, entity_id, day)
    if entity_type == "room":
        return occ.taken_slots_for_room_day(week, entity_id, day)
    return []


def _cost_gap_penalty_for_day_span(
    start_slot: int,
    duration: int,
    taken_slots: list[int],
    penalty: float,
) -> float:
    if not taken_slots:
        return 0.0

    start_in_day = _slot_in_day(start_slot)
    finish_in_day = start_in_day + duration - 1

    earliest = taken_slots[0]
    latest = taken_slots[-1]

    if start_in_day > earliest and finish_in_day < latest:
        return penalty
    return 0.0


def _candidate_cost(
    gene: ClassSessionGene,
    start_slot: int,
    room_id: int,
    instr_id: int,
    weeks: list[int],
    rooms_lookup: RoomsLookup,
    occ: Occupancy,
) -> float:
    """
    Compute candidate cost using occupancy indexes (occ) for gap penalties.
    """
    duration = max(1, int(getattr(gene, "duration_slots", 1)))

    cost = 0.0
    cost += _cost_early_start(start_slot)
    cost += _cost_room_waste(gene, room_id, rooms_lookup)
    cost += _cost_late_finish(start_slot, duration)

    day = _day(start_slot)
    for w in weeks:
        group_taken = _taken_slots_for_day_indexed(
            occ=occ, week=w, entity_id=gene.group_id, day=day, entity_type="group"
        )
        cost += _cost_gap_penalty_for_day_span(
            start_slot=start_slot,
            duration=duration,
            taken_slots=group_taken,
            penalty=5.0,
        )

        instr_taken = _taken_slots_for_day_indexed(
            occ=occ, week=w, entity_id=instr_id, day=day, entity_type="instr"
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
    class_type_norm = (
        "" if gene.class_type is None else str(gene.class_type).strip().upper()
    )
    comp_key = (gene.course_code, class_type_norm)
    competent = list(ctx.competencies_map.get(comp_key, []))
    all_instr = list(ctx.instructors_lookup.keys())
    instr_candidates = competent or all_instr
    if ctx.randomize:
        ctx.rng.shuffle(instr_candidates)
    return instr_candidates


def _room_satisfies_requirements(gene: ClassSessionGene, room: dict) -> bool:
    if int(room.get("room_capacity", 0) or 0) < int(gene.group_size):
        return False

    room_pc = int(room.get("pc_amount", 0) or 0)
    if getattr(gene, "pc_needed", False):
        required_pc = int(getattr(gene, "required_pc_amount", 1))
        if room_pc < required_pc:
            return False

    if getattr(gene, "projector_needed", False) and not bool(room.get("projector_availability", False)):
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
    inp: EvalInput, *, ctx: GreedyContext, occ: Occupancy
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
                occ=occ,
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
    inp: StartSlotInput, *, ctx: GreedyContext, occ: Occupancy
) -> Optional[BestTuple]:
    feasible_rooms = _iter_feasible_rooms(
        inp.candidate_rooms, inp.weeks, inp.start_slot, inp.duration, occ
    )
    if not feasible_rooms:
        return None

    feasible_instr = _iter_feasible_instructors(
        inp.instr_candidates, inp.weeks, inp.start_slot, inp.duration, occ
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


def find_best_assignment_for_gene(
    gene: ClassSessionGene,
    *,
    ctx: GreedyContext,
    occ: Occupancy,
) -> Optional[BestTuple]:
    """
    Returns a BestTuple or None.
    """
    if not gene.allowed_week_patterns:
        return None

    duration = max(1, int(getattr(gene, "duration_slots", 1)))

    instr_candidates = _get_instructor_candidates(gene, ctx)
    candidate_rooms = _get_candidate_rooms(gene, ctx)
    if not candidate_rooms:
        return None

    return _best_over_patterns(
        gene,
        duration=duration,
        candidate_rooms=candidate_rooms,
        instr_candidates=instr_candidates,
        ctx=ctx,
        occ=occ,
    )
