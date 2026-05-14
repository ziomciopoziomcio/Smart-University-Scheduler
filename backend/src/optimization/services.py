from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from collections import defaultdict

from ..academics import models as ac_mod
from ..courses import models as course_models
from ..facilities import models as fac_models
from ..settings import models as settings_models
from ..academics.models import SemesterType


class MissingPlannerSettingsError(Exception):
    pass


def _get_rooms(faculty_id: int, db: Session):
    return (
        db.query(
            fac_models.Room.id,
            fac_models.Room.room_capacity,
            fac_models.Room.pc_amount,
            fac_models.Room.projector_availability,
        )
        .filter(fac_models.Room.faculty_id == faculty_id)
        .all()
    )


def _get_competencies(faculty_id: int, db: Session):
    faculty_courses_sq = (
        db.query(course_models.Curriculum_course.course)
        .join(
            course_models.Study_program,
            course_models.Curriculum_course.study_program
            == course_models.Study_program.id,
        )
        .join(
            course_models.Study_fields,
            course_models.Study_program.study_field == course_models.Study_fields.id,
        )
        .filter(course_models.Study_fields.faculty == faculty_id)
        .distinct()
        .subquery()
    )

    return (
        db.query(
            course_models.Courses_instructors.course,
            course_models.Courses_instructors.class_type,
            func.sum(course_models.Courses_instructors.hours).label("total_hours"),
        )
        .filter(course_models.Courses_instructors.course.in_(faculty_courses_sq))
        .group_by(
            course_models.Courses_instructors.course,
            course_models.Courses_instructors.class_type,
        )
        .all()
    )


def _get_member_count_subquery(db: Session):
    return (
        db.query(
            ac_mod.Group_members.group.label("group_id"),
            func.count(ac_mod.Group_members.student).label("members_amount"),
        )
        .group_by(ac_mod.Group_members.group)
        .subquery()
    )


def _get_requirements(faculty_id: int, db: Session):
    member_count_sq = _get_member_count_subquery(db)

    return (
        db.query(
            course_models.Course_type_detail.course.label("course_code"),
            course_models.Course_type_detail.class_type,
            course_models.Course_type_detail.class_hours,
            course_models.Course_type_detail.pc_needed,
            course_models.Course_type_detail.projector_needed,
            course_models.Course_type_detail.max_group_participants_number,
            ac_mod.Groups.group_name,
            func.coalesce(member_count_sq.c.members_amount, 0).label("members_amount"),
            course_models.Study_fields.mode.label("study_mode"),
            course_models.Study_fields.degree.label("study_degree"),
        )
        .select_from(course_models.Study_program)
        .join(
            course_models.Study_fields,
            course_models.Study_program.study_field == course_models.Study_fields.id,
        )
        .join(
            course_models.Curriculum_course,
            course_models.Curriculum_course.study_program
            == course_models.Study_program.id,
        )
        .join(
            course_models.Course_type_detail,
            course_models.Course_type_detail.course
            == course_models.Curriculum_course.course,
        )
        .join(
            ac_mod.Groups,
            ac_mod.Groups.study_program == course_models.Study_program.id,
        )
        .outerjoin(member_count_sq, member_count_sq.c.group_id == ac_mod.Groups.id)
        .filter(course_models.Study_fields.faculty == faculty_id)
        .filter(
            or_(
                and_(
                    course_models.Curriculum_course.major.is_(None),
                    ac_mod.Groups.major.is_(None),
                ),
                course_models.Curriculum_course.major == ac_mod.Groups.major,
            )
        )
        .filter(
            or_(
                and_(
                    course_models.Curriculum_course.elective_block.is_(None),
                    ac_mod.Groups.elective_block.is_(None),
                ),
                course_models.Curriculum_course.elective_block
                == ac_mod.Groups.elective_block,
            )
        )
        .filter(ac_mod.Groups.is_active.is_(True))
        .filter(course_models.Curriculum_course.semester == ac_mod.Groups.semester)
        .all()
    )


def _check_semester_parity(
    faculty_id: int, target_semester: SemesterType, db: Session
) -> list[str]:
    active_groups = (
        db.query(ac_mod.Groups.group_name, ac_mod.Groups.semester)
        .join(
            course_models.Study_program,
            ac_mod.Groups.study_program == course_models.Study_program.id,
        )
        .join(
            course_models.Study_fields,
            course_models.Study_program.study_field == course_models.Study_fields.id,
        )
        .filter(course_models.Study_fields.faculty == faculty_id)
        .filter(ac_mod.Groups.is_active.is_(True))
        .all()
    )

    mismatched_groups = []
    for g_name, semester in active_groups:
        if target_semester == SemesterType.WINTER and semester % 2 == 0:
            mismatched_groups.append(f"{g_name} (currently semester: {semester})")
        elif target_semester == SemesterType.SUMMER and semester % 2 != 0:
            mismatched_groups.append(f"{g_name} (currently semester: {semester})")

    return mismatched_groups


def _calculate_available_workload(competencies) -> dict:
    available_workload = {}
    for comp in competencies:
        c_type = str(
            comp.class_type.value
            if hasattr(comp.class_type, "value")
            else comp.class_type
        )
        norm_type = c_type.split(".")[-1].strip().upper()
        key = (comp.course, norm_type)
        available_workload[key] = available_workload.get(key, 0) + float(
            comp.total_hours or 0
        )
    return available_workload


def _pack_bins(req_list_sorted, class_type, oversized_groups) -> list:
    bins = []
    for req in req_list_sorted:
        placed = False
        members = int(req.members_amount)
        max_cap = int(req.max_group_participants_number)

        if members > max_cap:
            oversized_groups.append(
                {
                    "course_code": req.course_code,
                    "class_type": class_type,
                    "group_name": req.group_name,
                    "members_amount": members,
                    "max_capacity": max_cap,
                }
            )

        for b in bins:
            if b["members_amount"] + members <= max_cap:
                b["members_amount"] += members
                b["group_names"].append(req.group_name)
                placed = True
                break

        if not placed:
            bins.append(
                {
                    "course_code": req.course_code,
                    "class_type": class_type,
                    "class_hours": float(req.class_hours or 0),
                    "pc_needed": bool(req.pc_needed),
                    "projector_needed": bool(req.projector_needed),
                    "group_names": [req.group_name],
                    "members_amount": members,
                }
            )
    return bins


def _bin_pack_requirements(requirements) -> tuple[list, list]:
    grouped_requirements = defaultdict(list)
    for req in requirements:
        c_type = str(
            req.class_type.value if hasattr(req.class_type, "value") else req.class_type
        )
        norm_type = c_type.split(".")[-1].strip().upper()
        req_key = (req.course_code, norm_type, req.study_mode, req.study_degree)
        grouped_requirements[req_key].append(req)

    processed_reqs = []
    oversized_groups = []

    for req_key, req_list in grouped_requirements.items():
        req_list_sorted = sorted(
            req_list, key=lambda r: int(r.members_amount), reverse=True
        )
        bins = _pack_bins(req_list_sorted, req_key[1], oversized_groups)
        processed_reqs.extend(bins)

    return processed_reqs, oversized_groups


def _has_suitable_room(rooms, members: int, pc: bool, proj: bool) -> bool:

    for room in rooms:
        if room.room_capacity < members:
            return False

        if pc and (room.pc_amount or 0) < members:
            continue
        if proj and not room.projector_availability:
            continue

        return True

    return False


def _validate_rooms(processed_reqs, rooms) -> tuple[dict, list]:
    required_workload = {}
    no_suitable_rooms = []

    rooms.sort(key=lambda r: r.room_capacity, reverse=True)

    for req in processed_reqs:
        key = (req["course_code"], req["class_type"])
        required_workload[key] = required_workload.get(key, 0) + req["class_hours"]

        members = req["members_amount"]
        pc = req["pc_needed"]
        proj = req["projector_needed"]

        if not _has_suitable_room(rooms, members, pc, proj):
            no_suitable_rooms.append(
                {
                    "course_code": req["course_code"],
                    "group_names": req["group_names"],
                    "members_amount": members,
                    "pc_needed": pc,
                    "projector_needed": proj,
                }
            )

    return required_workload, no_suitable_rooms


def _calculate_workload_mismatches(
    required_workload, available_workload
) -> tuple[list, list]:
    missing_competencies = []
    workload_mismatch = []

    for key, req_hours in required_workload.items():
        course_code, norm_type = key
        avail_hours = available_workload.get(key, 0)

        if avail_hours == 0:
            missing_competencies.append(f"{course_code} ({norm_type})")
        elif avail_hours < req_hours:
            workload_mismatch.append(
                {
                    "course_code": course_code,
                    "class_type": norm_type,
                    "required_hours": req_hours,
                    "available_hours": avail_hours,
                }
            )

    return missing_competencies, workload_mismatch


def validate_optimization_data(faculty_id: int, db: Session) -> dict:
    planner_config: settings_models.PlannerSettings | None = (
        db.query(settings_models.PlannerSettings)
        .filter_by(faculty_id=faculty_id)
        .first()
    )

    if not planner_config:
        raise MissingPlannerSettingsError(
            f"No planner settings found for faculty {faculty_id}. Please configure the planner settings before optimization."
        )

    target_semester = planner_config.planned_semester_type

    rooms = _get_rooms(faculty_id, db)
    competencies = _get_competencies(faculty_id, db)
    requirements = _get_requirements(faculty_id, db)

    available_workload = _calculate_available_workload(competencies)
    processed_reqs, oversized_groups = _bin_pack_requirements(requirements)
    required_workload, no_suitable_rooms = _validate_rooms(processed_reqs, rooms)

    missing_competencies, workload_mismatch = _calculate_workload_mismatches(
        required_workload, available_workload
    )

    mismatched_semesters = _check_semester_parity(faculty_id, target_semester, db)

    return {
        "total_genes_to_generate": len(processed_reqs),
        "missing_competencies": missing_competencies,
        "workload_mismatch": workload_mismatch,
        "no_suitable_rooms": no_suitable_rooms,
        "oversized_groups": oversized_groups,
        "semester_parity_warnings": mismatched_semesters,
    }
