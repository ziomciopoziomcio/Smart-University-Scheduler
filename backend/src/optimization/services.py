from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from ..academics import models as ac_mod
from ..courses import models as course_models
from ..users import models as user_models
from ..facilities import models as fac_models


def validate_optimization_data(faculty_id: int, db: Session) -> dict:
    rooms = (
        db.query(
            fac_models.Room.id,
            fac_models.Room.room_capacity,
            fac_models.Room.pc_amount,
            fac_models.Room.projector_availability,
        )
        .filter(fac_models.Room.faculty_id == faculty_id)
        .all()
    )

    competencies = (
        db.query(
            course_models.Courses_instructors.course,
            course_models.Courses_instructors.class_type,
            func.sum(course_models.Courses_instructors.hours).label("total_hours"),
        )
        .join(
            user_models.Employees,
            course_models.Courses_instructors.employee == user_models.Employees.id,
        )
        .filter(user_models.Employees.faculty_id == faculty_id)
        .group_by(
            course_models.Courses_instructors.course,
            course_models.Courses_instructors.class_type,
        )
        .all()
    )

    member_count_sq = (
        db.query(
            ac_mod.Group_members.group.label("group_id"),
            func.count(ac_mod.Group_members.student).label("members_amount"),
        )
        .group_by(ac_mod.Group_members.group)
        .subquery()
    )

    requirements = (
        db.query(
            course_models.Course_type_detail.course.label("course_code"),
            course_models.Course_type_detail.class_type,
            course_models.Course_type_detail.class_hours,
            course_models.Course_type_detail.pc_needed,
            course_models.Course_type_detail.projector_needed,
            ac_mod.Groups.group_name,
            func.coalesce(member_count_sq.c.members_amount, 0).label("members_amount"),
        )
        .select_from(course_models.Study_programs)
        .join(
            course_models.Study_fields,
            course_models.Study_programs.study_field == course_models.Study_fields.id,
        )
        .join(
            course_models.Curriculum_course,
            course_models.Curriculum_course.study_program
            == course_models.Study_programs.id,
        )
        .join(
            course_models.Course_type_detail,
            course_models.Course_type_detail.course
            == course_models.Curriculum_course.course,
        )
        .join(
            ac_mod.Groups,
            ac_mod.Groups.study_program == course_models.Study_programs.id,
        )
        .outerjoin(member_count_sq, member_count_sq.c.group_id == ac_mod.Groups.id)
        .filter(course_models.Study_fields.faculty == faculty_id)
        .filter(
            or_(
                course_models.Curriculum_course.major is None,
                course_models.Curriculum_course.major == ac_mod.Groups.major,
            )
        )
        .filter(
            or_(
                course_models.Curriculum_course.elective_block is None,
                course_models.Curriculum_course.elective_block
                == ac_mod.Groups.elective_block,
            )
        )
        .all()
    )

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

    required_workload = {}
    missing_competencies = []
    workload_mismatch = []
    no_suitable_rooms = []

    for req in requirements:
        c_type = str(
            req.class_type.value if hasattr(req.class_type, "value") else req.class_type
        )
        norm_type = c_type.split(".")[-1].strip().upper()
        key = (req.course_code, norm_type)

        required_workload[key] = required_workload.get(key, 0) + float(
            req.class_hours or 0
        )

        members = int(req.members_amount)
        pc = bool(req.pc_needed)
        proj = bool(req.projector_needed)

        room_found = False
        for room in rooms:
            if room.room_capacity >= members:
                if pc and (room.pc_amount or 0) < members:
                    continue
                if proj and not room.projector_availability:
                    continue

                room_found = True
                break

        if not room_found:
            no_suitable_rooms.append(
                {
                    "course_code": req.course_code,
                    "group_name": req.group_name,
                    "members_amount": members,
                    "pc_needed": pc,
                    "projector_needed": proj,
                }
            )

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

    return {
        "total_genes_to_generate": len(requirements),
        "missing_competencies": missing_competencies,
        "workload_mismatch": workload_mismatch,
        "no_suitable_rooms": no_suitable_rooms,
    }
