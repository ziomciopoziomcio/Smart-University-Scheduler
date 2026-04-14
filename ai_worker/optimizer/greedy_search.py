from __future__ import annotations

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
    """
    Return zero-based day index for an absolute slot id.

    :param slot_id: Absolute slot id (1-based).
    :return: Zero-based day index.
    """
    return (slot_id - 1) // SLOTS_PER_DAY


def _slot_in_day(slot_id: int) -> int:
    """
    Return zero-based slot index inside a day for an absolute slot id.

    :param slot_id: Absolute slot id (1-based).
    :return: Zero-based slot-in-day index.
    """
    return (slot_id - 1) % SLOTS_PER_DAY


def _iter_gene_weeks(gene: ClassSessionGene, pattern_index: int) -> list[int]:
    """
    Return list of week numbers for a given gene pattern index.

    Behavior:
    - If gene.allowed_week_patterns is None -> means "all weeks" -> return 1..15.
    - If gene.allowed_week_patterns is an empty list -> no weeks -> return [].
    - If the selected pattern is None -> means "all weeks" -> return 1..15.
    - If the selected pattern is an empty/falsey sequence -> return [].
    - Otherwise return a concrete list of weeks.

    :param gene: ClassSessionGene instance.
    :param pattern_index: Index of the week pattern to retrieve.
    :return: List of week numbers (may be empty).
    """
    awp = getattr(gene, "allowed_week_patterns", None)
    if awp is None:
        return list(range(1, 16))
    if not awp:
        return []
    weeks = awp[pattern_index]
    if weeks is None:
        return list(range(1, 16))
    if not weeks:
        return []
    return list(weeks)


def _cost_early_start(start_slot: int) -> float:
    """
    Small penalty for starting later in the day (favors earlier starts).

    :param start_slot: Absolute start slot id.
    :return: Cost penalty as float.
    """
    return 0.20 * _slot_in_day(start_slot)


def _cost_room_waste(
    gene: ClassSessionGene, room_id: int, rooms_lookup: RoomsLookup
) -> float:
    """
    Penalize room waste: larger rooms than needed get a cost proportional to unused capacity.

    :param gene: ClassSessionGene describing the class.
    :param room_id: Candidate room id.
    :param rooms_lookup: Mapping of room_id -> room metadata dict.
    :return: Cost penalty as float.
    """
    cap = int(rooms_lookup[room_id].get("room_capacity", 0) or 0)
    return 0.05 * max(0, cap - int(gene.group_size))


def _cost_late_finish(start_slot: int, duration: int) -> float:
    """
    Penalty for finishing late in the day (after a threshold slot).

    :param start_slot: Absolute start slot id.
    :param duration: Number of slots the class occupies.
    :return: Cost penalty as float.
    """
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

    entity_type must be one of {"group", "instr", "room"}.
    Returns a sorted list (may be empty).

    :param occ: Occupancy index object.
    :param week: Week number.
    :param entity_id: Entity id (group/instructor/room).
    :param day: Zero-based day index.
    :param entity_type: One of "group", "instr", "room".
    :return: Sorted list of slot_in_day integers.
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
    """
    Return a gap penalty if the proposed [start, finish] lies strictly inside an existing span of occupied slots for that entity in the same day.

    :param start_slot: Absolute start slot id.
    :param duration: Number of slots in the candidate.
    :param taken_slots: Sorted list of occupied slot_in_day values for that day.
    :param penalty: Penalty value to apply when candidate lies inside existing span.
    :return: Penalty (0.0 or penalty value).
    """
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
    Compute heuristic cost for a candidate assignment (start_slot, room, instructor).
    Cost combines early-start, room-waste, late-finish, and gap penalties for
    group and instructor occupancy across the requested weeks.

    :param gene: ClassSessionGene being scheduled.
    :param start_slot: Absolute start slot id.
    :param room_id: Candidate room id.
    :param instr_id: Candidate instructor id.
    :param weeks: List of week numbers the candidate covers.
    :param rooms_lookup: Rooms lookup dict.
    :param occ: Occupancy indexes.
    :return: Computed cost as float (lower is better).
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
    """
    Return a sequence of pattern indices for the gene.

    If gene.allowed_week_patterns is None, treat it as a single implicit
    pattern (index 0) representing "all weeks". If it's an actual list,
    return range(len(list)). When randomization is enabled, shuffle indices.

    :param gene: ClassSessionGene.
    :param ctx: GreedyContext controlling randomization.
    :return: List of pattern indices to try.
    """
    awp = getattr(gene, "allowed_week_patterns", None)
    if awp is None:
        idxs = [0]
    else:
        idxs = list(range(len(awp)))
    if ctx.randomize:
        ctx.rng.shuffle(idxs)
    return idxs


def _get_instructor_candidates(gene: ClassSessionGene, ctx: GreedyContext) -> list[int]:
    """
    Return an ordered list of instructor candidate ids for the gene.
    If randomize is enabled a weighted randomization based on past assignments
    is used; otherwise instructors are ordered by historical assignment counts.

    :param gene: ClassSessionGene.
    :param ctx: GreedyContext with instructors_lookup and instructor_assignments.
    :return: Ordered list of instructor ids.
    """
    allowed = getattr(gene, "allowed_instructors", [])
    if not allowed:
        allowed = list(ctx.instructors_lookup.keys())

    assignments_dict = getattr(ctx, "instructor_assignments", {})

    if ctx.randomize:
        if assignments_dict:
            weights = [
                max(
                    1, assignments_dict.get((iid, gene.course_code, gene.class_type), 0)
                )
                for iid in allowed
            ]
            weighted_order = sorted(
                zip(allowed, weights),
                key=lambda xw: ctx.rng.random() ** (1.0 / xw[1]),
                reverse=True,
            )
            return [iid for iid, _ in weighted_order]
        else:
            shuffled = list(allowed)
            ctx.rng.shuffle(shuffled)
            return shuffled
    else:
        if assignments_dict:
            return sorted(
                allowed,
                key=lambda iid: assignments_dict.get(
                    (iid, gene.course_code, gene.class_type), 0
                ),
                reverse=True,
            )

    return allowed


def _room_satisfies_requirements(gene: ClassSessionGene, room: dict) -> bool:
    """
    Check whether a room fulfills the size and equipment requirements of the gene.
    Compares capacity and required PC/projector counts if present on the gene.

    :param gene: ClassSessionGene with required attributes.
    :param room: Room metadata dict.
    :return: True if room satisfies requirements, False otherwise.
    """
    if int(room.get("room_capacity", 0) or 0) < int(gene.group_size):
        return False

    room_pc = int(room.get("pc_amount", 0) or 0)
    if getattr(gene, "pc_needed", False):
        required_pc = int(getattr(gene, "required_pc_amount", 1))
        if room_pc < required_pc:
            return False

    if getattr(gene, "projector_needed", False) and not bool(
        room.get("projector_availability", False)
    ):
        return False

    return True


def _collect_candidate_rooms(gene: ClassSessionGene, ctx: GreedyContext) -> list[int]:
    """
    Return candidate room ids for a gene. If gene.allowed_rooms is set, return it directly; otherwise filter all rooms by requirements.

    :param gene: ClassSessionGene.
    :param ctx: GreedyContext with rooms_lookup and room_ids_sorted.
    :return: List of candidate room ids.
    """
    if getattr(gene, "allowed_rooms", None):
        return gene.allowed_rooms

    return [
        rid
        for rid in ctx.room_ids_sorted
        if _room_satisfies_requirements(gene, ctx.rooms_lookup[rid])
    ]


def _maybe_shuffle(
    items: list[int], ctx: GreedyContext, probability: float = 0.2
) -> None:
    """
    Shuffle a list in-place with given probability when randomize is enabled.

    :param items: List of integers to possibly shuffle.
    :param ctx: GreedyContext containing rng and randomize flag.
    :param probability: Probability to perform shuffle (0..1).
    :return: None.
    """
    if ctx.randomize and items and ctx.rng.random() < probability:
        ctx.rng.shuffle(items)


def _get_candidate_rooms(gene: ClassSessionGene, ctx: GreedyContext) -> list[int]:
    """
    Collect and possibly shuffle candidate rooms for the gene.

    :param gene: ClassSessionGene.
    :param ctx: GreedyContext.
    :return: List of candidate room ids (possibly shuffled).
    """
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
    """
    Check that the group and its conflicting groups are free for all weeks and all slots in the requested interval.

    :param gene: ClassSessionGene with group_id.
    :param weeks: Weeks to check.
    :param start_slot: Absolute start slot id.
    :param duration: Duration in slots.
    :param occupied_group: Set of occupied (week, slot, group_id) tuples.
    :param conflicting_groups: Map group_id -> set(conflicting_group_ids).
    :return: True if group and its conflicting groups are free, False otherwise.
    """
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
    """
    Return True if the room is free for the given weeks and slots.

    :param rid: Room id.
    :param weeks: Weeks to check.
    :param start_slot: Absolute start slot id.
    :param duration: Duration in slots.
    :param occupied_room: Set of occupied (week, slot, room_id) tuples.
    :return: True if room is free for all slots in weeks; False otherwise.
    """
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
    """
    Return True if the instructor is free for the given weeks and slots.

    :param iid: Instructor id.
    :param weeks: Weeks to check.
    :param start_slot: Absolute start slot id.
    :param duration: Duration in slots.
    :param occupied_instr: Set of occupied (week, slot, instr_id) tuples.
    :return: True if instructor is free for all slots in weeks; False otherwise.
    """
    for w in weeks:
        for s in range(start_slot, start_slot + duration):
            if (w, s, iid) in occupied_instr:
                return False
    return True


def _iter_feasible_start_slots(duration: int, ctx: GreedyContext) -> list[int]:
    """
    Iterate feasible absolute start slots for the given duration.
    When randomize is enabled the list is sorted with randomness within equal
    slot-in-day categories to diversify choices.

    :param duration: Duration in slots.
    :param ctx: GreedyContext controlling randomization.
    :return: List of candidate absolute start slots.
    """
    slots = list(range(1, MAX_SLOT_ID - duration + 2))
    if ctx.randomize:
        slots = sorted(slots, key=lambda x: (_slot_in_day(x), ctx.rng.random()))
    return slots


def _is_start_slot_valid_for_day_boundary(start_slot: int, duration: int) -> bool:
    """
    Return True if the start_slot + duration does not cross day boundary.

    :param start_slot: Absolute start slot id.
    :param duration: Duration in slots.
    :return: True if candidate fits inside a single day.
    """
    return _slot_in_day(start_slot) + duration <= SLOTS_PER_DAY


def _iter_feasible_rooms(
    candidate_rooms: list[int],
    weeks: list[int],
    start_slot: int,
    duration: int,
    occ: Occupancy,
) -> list[int]:
    """
    Return subset of candidate_rooms free for the given weeks and slots.

    :param candidate_rooms: Candidate room ids.
    :param weeks: Weeks to check.
    :param start_slot: Absolute start slot id.
    :param duration: Duration in slots.
    :param occ: Occupancy indexes.
    :return: Filtered list of room ids free for all weeks and slots.
    """
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
    """
    Return subset of instructor candidates free for the given weeks and slots.

    :param instr_candidates: Candidate instructor ids.
    :param weeks: Weeks to check.
    :param start_slot: Absolute start slot id.
    :param duration: Duration in slots.
    :param occ: Occupancy indexes.
    :return: Filtered list of instructor ids free for all weeks and slots.
    """
    return [
        iid
        for iid in instr_candidates
        if _is_instructor_ok(iid, weeks, start_slot, duration, occ.occupied_instr)
    ]


def _update_best(
    best: BestTuple | None, cand: BestTuple
) -> tuple[BestTuple | None, bool]:
    """
    Compare and update best candidate tuple; return (new_best, changed_flag).

    :param best: Current best candidate tuple or None.
    :param cand: Candidate tuple to compare.
    :return: (new_best, changed_flag) where changed_flag is True if best was updated.
    """
    if best is None or cand[0] < best[0]:
        return cand, True
    return best, False


def _evaluate_candidates_for_start_slot(
    inp: EvalInput, *, ctx: GreedyContext, occ: Occupancy
) -> BestTuple | None:
    """
    Evaluate all (room, instructor) pairs for a given start slot.
    Return the best candidate (cost, start_slot, room_id, instr_id, pattern_index, weeks)
    or None if no feasible candidate was found.

    :param inp: EvalInput containing gene, weeks, start_slot, duration and feasible lists.
    :param ctx: GreedyContext with rooms_lookup and rng.
    :param occ: Occupancy indexes.
    :return: BestTuple or None.
    """
    best_local: BestTuple | None = None

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
) -> BestTuple | None:
    """
    For a particular start slot, compute feasible rooms/instructors and evaluate their candidates returning the best found tuple or None.

    :param inp: StartSlotInput for this start slot.
    :param ctx: GreedyContext.
    :param occ: Occupancy indexes.
    :return: BestTuple or None.
    """
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
) -> BestTuple | None:
    """
    Find the best assignment over all feasible start slots for a fixed weeks set.

    :param gene: ClassSessionGene.
    :param weeks: Weeks to consider.
    :param pidx: Pattern index.
    :param duration: Duration in slots.
    :param candidate_rooms: Candidate room ids.
    :param instr_candidates: Candidate instructor ids.
    :param ctx: GreedyContext.
    :param occ: Occupancy indexes.
    :return: BestTuple or None.
    """
    best: BestTuple | None = None

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
) -> BestTuple | None:
    """
    Try each week-pattern (possibly shuffled) and return the overall best candidate.

    :param gene: ClassSessionGene.
    :param duration: Duration in slots.
    :param candidate_rooms: Candidate rooms.
    :param instr_candidates: Candidate instructors.
    :param ctx: GreedyContext.
    :param occ: Occupancy indexes.
    :return: BestTuple or None.
    """
    best: BestTuple | None = None

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
) -> BestTuple | None:
    """
    Public entry: find the best assignment for a gene given the search context and current occupancy indexes.
    Returns a BestTuple or None if no feasible assignment exists.

    :param gene: ClassSessionGene to schedule.
    :param ctx: GreedyContext with lookup tables and rng.
    :param occ: Occupancy indexes for fast availability checks.
    :return: BestTuple describing chosen assignment or None when no feasible assignment exists.
    """
    awp = getattr(gene, "allowed_week_patterns", None)
    if awp is not None and not awp:
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
