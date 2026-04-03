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

    # preference: earlier in day
    cost += 0.20 * _slot_in_day(start_slot)

    # minimize room waste
    cap = int(rooms_lookup[room_id].get("room_capacity", 0) or 0)
    cost += 0.05 * max(0, cap - int(gene.group_size))

    # penalize late finishes
    cost += 0.10 * max(0, _slot_in_day(finish) - 7)

    # gap penalty: if we schedule inside existing span for that day
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


def greedy_assign(
    base_genes: List[ClassSessionGene],
    data: dict,
    randomize: bool = False,
    seed: Optional[int] = None,
) -> List[ClassSessionGene]:
    """
    Best-fit greedy assignment:
    - For each gene (hardest first), tries (pattern, slot, room, instructor)
      and chooses the candidate with minimal heuristic cost.

    Hard constraints:
    - no collision for room/instructor/group in overlapping (week, slot)
    - no collision with conflicting groups (checked against their *real* occupied slots)
    - room capacity + equipment
    - class cannot cross day boundary
    """
    if seed is not None:
        random.seed(seed)

    rooms_lookup, instructors_lookup, competencies_map, conflicting_groups = (
        build_lookups(data)
    )

    # order rooms by capacity ascending
    room_ids_sorted = sorted(
        rooms_lookup.keys(),
        key=lambda rid: rooms_lookup[rid].get("room_capacity", 0) or 0,
    )

    occupied_room: set[tuple[int, int, int]] = set()
    occupied_instr: set[tuple[int, int, int]] = set()
    occupied_group: set[tuple[int, int, int]] = set()

    def gene_priority(g: ClassSessionGene) -> tuple:
        equipment = (1 if g.pc_needed else 0) + (1 if g.projector_needed else 0)
        patterns = len(g.allowed_week_patterns or [])
        return -int(g.group_size), -int(g.duration_slots), -equipment, patterns

    genes_ordered = sorted(base_genes, key=gene_priority)

    for gene in genes_ordered:
        if not gene.allowed_week_patterns:
            continue

        duration = max(1, int(getattr(gene, "duration_slots", 1)))

        # instructors candidates
        comp_key = (gene.course_code, gene.class_type)
        competent = list(competencies_map.get(comp_key, []))
        all_instr = list(instructors_lookup.keys())
        instr_candidates = competent or all_instr
        if randomize:
            random.shuffle(instr_candidates)

        # candidate rooms filtered by capacity + equipment
        candidate_rooms: list[int] = []
        for rid in room_ids_sorted:
            r = rooms_lookup[rid]
            if int(r.get("room_capacity", 0) or 0) < int(gene.group_size):
                continue
            if gene.pc_needed and int(r.get("pc_amount", 0) or 0) <= 0:
                continue
            if gene.projector_needed and not bool(
                r.get("projector_availability", False)
            ):
                continue
            candidate_rooms.append(rid)

        if not candidate_rooms:
            continue

        if randomize and random.random() < 0.2:
            random.shuffle(candidate_rooms)

        pattern_indices = list(range(len(gene.allowed_week_patterns)))
        if randomize:
            random.shuffle(pattern_indices)

        best: Optional[tuple[float, int, int, int, int, list[int]]] = None

        for pidx in pattern_indices:
            weeks = _iter_gene_weeks(gene, pidx)
            if not weeks:
                continue

            slot_range = list(range(1, MAX_SLOT_ID - duration + 2))
            if randomize:
                slot_range = sorted(
                    slot_range, key=lambda x: (_slot_in_day(x), random.random())
                )

            for start_slot in slot_range:
                if _slot_in_day(start_slot) + duration > SLOTS_PER_DAY:
                    continue

                ok = True
                for w in weeks:
                    for s in range(start_slot, start_slot + duration):
                        if (w, s, gene.group_id) in occupied_group:
                            ok = False
                            break
                        for cg in conflicting_groups.get(gene.group_id, set()):
                            if (w, s, cg) in occupied_group:
                                ok = False
                                break
                    if not ok:
                        break
                if not ok:
                    continue

                for rid in candidate_rooms:
                    room_ok = True
                    for w in weeks:
                        for s in range(start_slot, start_slot + duration):
                            if (w, s, rid) in occupied_room:
                                room_ok = False
                                break
                        if not room_ok:
                            break
                    if not room_ok:
                        continue

                    for iid in instr_candidates:
                        instr_ok = True
                        for w in weeks:
                            for s in range(start_slot, start_slot + duration):
                                if (w, s, iid) in occupied_instr:
                                    instr_ok = False
                                    break
                            if not instr_ok:
                                break
                        if not instr_ok:
                            continue

                        cost = _candidate_cost(
                            gene=gene,
                            start_slot=start_slot,
                            room_id=rid,
                            instr_id=iid,
                            weeks=weeks,
                            rooms_lookup=rooms_lookup,
                            occupied_group=occupied_group,
                            occupied_instr=occupied_instr,
                        )

                        if best is None or cost < best[0]:
                            best = (cost, start_slot, rid, iid, pidx, weeks)

                        # micro-early-exit for deterministic mode
                        if best is not None and best[0] <= 0.1 and not randomize:
                            break

        if best is None:
            continue

        _, start_slot, room_id, instr_id, pidx, weeks = best

        gene.timeslot_id = start_slot
        gene.room_id = room_id
        gene.instructor_id = instr_id
        gene.selected_pattern_index = pidx

        for w in weeks:
            for s in range(start_slot, start_slot + duration):
                occupied_room.add((w, s, room_id))
                occupied_instr.add((w, s, instr_id))
                occupied_group.add((w, s, gene.group_id))

    return base_genes
