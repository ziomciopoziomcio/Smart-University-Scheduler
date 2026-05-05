from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from src.common.pagination.pagination import paginate
from src.common.pagination.pagination_model import PaginatedResponse
from src.common.router_utils import (
    _get_or_404,
    _commit_or_rollback,
    _apply_patch_or_reject_nulls,
    _get_by_fields_or_404,
    build_ilike_search_filter,
    apply_search_to_queries,
    apply_filters_to_queries,
)
from . import models, schemas
from ..common.require_permission import require_permission
from ..database.database import get_db
from ..users import models as user_models
from ..academics import models as ac_models

router = APIRouter(prefix="/course", tags=["course"])

STUDY_FIELD_LIMIT = 100
MAJOR_LIMIT = 100
ELECTIVE_BLOCK_LIMIT = 100
COURSE_TYPE_LIMIT = 100
COURSE_INSTRUCTOR_LIMIT = 100
COURSE_LIMIT = 100
STUDY_PROGRAM_LIMIT = 100
CURRICULUM_LIMIT = 100


# Study Fields
@router.post(
    "/study-fields",
    response_model=schemas.StudyFieldRead,
    status_code=status.HTTP_201_CREATED,
)
def create_study_field(
    payload: schemas.StudyFieldCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("study-field:create")
    ),
):
    obj = models.Study_fields(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get(
    "/study-fields", response_model=PaginatedResponse[schemas.StudyFieldListSummary]
)
def list_study_fields(
    faculty: int | None = Query(None),
    field_name: str | None = Query(None, min_length=1),
    limit: int = Query(STUDY_FIELD_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("study-fields:view")),
    search: str | None = Query(None, min_length=1),
):
    elective_blocks_sq = (
        db.query(func.count(models.Elective_block.id))
        .select_from(models.Elective_block)
        .filter(models.Elective_block.study_field == models.Study_fields.id)
        .correlate(models.Study_fields)
        .scalar_subquery()
    )

    programs_sq = (
        db.query(func.count(models.Study_program.id))
        .select_from(models.Study_program)
        .filter(models.Study_program.study_field == models.Study_fields.id)
        .correlate(models.Study_fields)
        .scalar_subquery()
    )

    query = (
        db.query(
            models.Study_fields.id,
            models.Study_fields.faculty,
            models.Study_fields.field_name,
            models.Study_fields.language,
            models.Study_fields.mode,
            func.count(func.distinct(models.Major.id)).label("specializations_count"),
            func.max(models.Curriculum_course.semester).label("semesters_count"),
            elective_blocks_sq.label("elective_blocks_count"),
            func.coalesce(programs_sq, 0).label("programs_count"),
        )
        .outerjoin(models.Major, models.Study_fields.id == models.Major.study_field)
        .outerjoin(
            models.Study_program,
            models.Study_fields.id == models.Study_program.study_field,
        )
        .outerjoin(
            models.Curriculum_course,
            models.Study_program.id == models.Curriculum_course.study_program,
        )
        .group_by(
            models.Study_fields.id,
            models.Study_fields.faculty,
            models.Study_fields.field_name,
            models.Study_fields.language,
            models.Study_fields.mode,
            elective_blocks_sq,
            programs_sq,
        )
    )
    count_query = db.query(models.Study_fields.id)

    if faculty is not None:
        filter_stmt = models.Study_fields.faculty == faculty
        query = query.filter(filter_stmt)
        count_query = count_query.filter(filter_stmt)

    if field_name is not None:
        filter_stmt = models.Study_fields.field_name.ilike(f"%{field_name}%")
        query = query.filter(filter_stmt)
        count_query = count_query.filter(filter_stmt)

    if search:
        f = build_ilike_search_filter(
            search,
            columns=[models.Study_fields.field_name],
        )
        if f is not None:
            query = query.filter(f)
            count_query = count_query.filter(f)

    pagination_result = paginate(
        query,
        limit,
        offset,
        order_by=models.Study_fields.id,
        count_query=count_query,
    )

    pagination_result.items = [
        schemas.StudyFieldListSummary(
            id=row.id,
            faculty=row.faculty,
            field_name=row.field_name,
            language=(
                row.language.value if hasattr(row.language, "value") else row.language
            ),
            mode=row.mode.value if hasattr(row.mode, "value") else row.mode,
            semesters_count=row.semesters_count or 0,
            specializations_count=row.specializations_count or 0,
            elective_blocks_count=row.elective_blocks_count or 0,
            programs_count=row.programs_count or 0,
        )
        for row in pagination_result.items
    ]

    return pagination_result


@router.get("/study-fields/{field_id}", response_model=schemas.StudyFieldRead)
def get_study_field(
    field_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("study-field:view")),
):
    return _get_or_404(db, models.Study_fields, field_id, "Study Field")


@router.patch("/study-fields/{field_id}", response_model=schemas.StudyFieldRead)
def update_study_field(
    field_id: int,
    payload: schemas.StudyFieldUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("study-field:update")
    ),
):
    obj = _get_or_404(db, models.Study_fields, field_id, "Study Field")
    _apply_patch_or_reject_nulls(obj, payload)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/study-fields/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_field(
    field_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("study-field:delete")
    ),
):
    obj = _get_or_404(db, models.Study_fields, field_id, "Study Field")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Major
@router.post(
    "/majors", response_model=schemas.MajorRead, status_code=status.HTTP_201_CREATED
)
def create_major(
    payload: schemas.MajorCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("major:create")),
):
    obj = models.Major(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/majors", response_model=PaginatedResponse[schemas.MajorRead])
def list_majors(
    study_field: int | None = Query(None),
    major_name: str | None = Query(None, min_length=1),
    semester: int | None = Query(
        None, description="Compute group_count for the given semester"
    ),
    limit: int | None = Query(MAJOR_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("majors:view")),
    search: str | None = Query(None, min_length=1),
):
    groups_subq = db.query(func.count(ac_models.Groups.id)).filter(
        ac_models.Groups.major == models.Major.id
    )

    if semester is not None:
        groups_subq = groups_subq.filter(ac_models.Groups.semester == semester)

    groups_subq = groups_subq.scalar_subquery()

    query = db.query(models.Major, func.coalesce(groups_subq, 0).label("group_count"))

    count_query = db.query(models.Major.id)

    if study_field is not None:
        filter_stmt = models.Major.study_field == study_field
        query = query.filter(filter_stmt)
        count_query = count_query.filter(filter_stmt)

    if major_name is not None:
        filter_stmt = models.Major.major_name.ilike(f"%{major_name}%")
        query = query.filter(filter_stmt)
        count_query = count_query.filter(filter_stmt)

    if search:
        query = query.join(
            models.Study_fields,
            models.Major.study_field == models.Study_fields.id,
        )
        count_query = count_query.join(
            models.Study_fields,
            models.Major.study_field == models.Study_fields.id,
        )

        f = build_ilike_search_filter(
            search,
            columns=[models.Major.major_name, models.Study_fields.field_name],
        )
        if f is not None:
            query = query.filter(f)
            count_query = count_query.filter(f)

    pagination_result = paginate(
        query,
        limit,
        offset,
        order_by=models.Major.id,
        count_query=count_query,
    )

    pagination_result.items = [
        schemas.MajorRead(
            id=row.Major.id,
            study_field=row.Major.study_field,
            major_name=row.Major.major_name,
            group_count=row.group_count,
        )
        for row in pagination_result.items
    ]

    return pagination_result


@router.get("/majors/{major_id}", response_model=schemas.MajorRead)
def get_major(
    major_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("major:view")),
):
    groups_subq = (
        db.query(func.count(ac_models.Groups.id))
        .filter(ac_models.Groups.major == models.Major.id)
        .scalar_subquery()
    )

    row = (
        db.query(models.Major, func.coalesce(groups_subq, 0).label("group_count"))
        .filter(models.Major.id == major_id)
        .first()
    )

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Major not found"
        )

    return schemas.MajorRead(
        id=row.Major.id,
        study_field=row.Major.study_field,
        major_name=row.Major.major_name,
        group_count=row.group_count,
    )


@router.patch("/majors/{major_id}", response_model=schemas.MajorRead)
def update_major(
    major_id: int,
    payload: schemas.MajorUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("major:update")),
):
    obj = _get_or_404(db, models.Major, major_id, "Major")
    _apply_patch_or_reject_nulls(obj, payload, nullable_fields={"study_field"})
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/majors/{major_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_major(
    major_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("major:delete")),
):
    obj = _get_or_404(db, models.Major, major_id, "Major")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Elective Blocks
@router.post(
    "/elective-blocks",
    response_model=schemas.ElectiveBlockRead,
    status_code=status.HTTP_201_CREATED,
)
def create_elective_block(
    payload: schemas.ElectiveBlockCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("elective-block:create")
    ),
):
    obj = models.Elective_block(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get(
    "/elective-blocks",
    response_model=PaginatedResponse[schemas.ElectiveBlockRead],
)
def list_elective_blocks(
    study_field: int | None = Query(None),
    semester: int | None = Query(None, gt=0),
    elective_block_name: str | None = Query(None, min_length=1),
    limit: int | None = Query(ELECTIVE_BLOCK_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("elective-blocks:view")
    ),
    search: str | None = Query(None, min_length=1),
):
    query = db.query(models.Elective_block)

    if semester is not None:
        query = query.join(
            models.Curriculum_course,
            models.Elective_block.id == models.Curriculum_course.elective_block,
        ).filter(models.Curriculum_course.semester == semester)

    if study_field is not None:
        query = query.filter(models.Elective_block.study_field == study_field)
    if elective_block_name is not None:
        query = query.filter(
            models.Elective_block.elective_block_name.ilike(f"%{elective_block_name}%")
        )
    if search:
        f = build_ilike_search_filter(
            search, columns=[models.Elective_block.elective_block_name]
        )
        if f is not None:
            query = query.filter(f)

    if semester is not None:
        query = query.distinct()

    return paginate(query, limit, offset, models.Elective_block.id)


@router.get("/elective-blocks/{block_id}", response_model=schemas.ElectiveBlockRead)
def get_elective_block(
    block_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("elective-block:view")
    ),
):
    return _get_or_404(db, models.Elective_block, block_id, "Elective Block")


@router.patch("/elective-blocks/{block_id}", response_model=schemas.ElectiveBlockRead)
def update_elective_block(
    block_id: int,
    payload: schemas.ElectiveBlockUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("elective-block:update")
    ),
):
    obj = _get_or_404(db, models.Elective_block, block_id, "Elective Block")
    _apply_patch_or_reject_nulls(obj, payload)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/elective-blocks/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_elective_block(
    block_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("elective-block:delete")
    ),
):
    obj = _get_or_404(db, models.Elective_block, block_id, "Elective Block")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Course Type Detail
@router.post(
    "/types",
    response_model=schemas.CourseTypeDetailRead,
    status_code=status.HTTP_201_CREATED,
)
def create_course_type(
    payload: schemas.CourseTypeDetailCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("course-type:create")
    ),
):
    obj = models.Course_type_detail(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/types", response_model=PaginatedResponse[schemas.CourseTypeDetailRead])
def list_course_types(
    course: int | None = Query(None),
    class_type: models.ClassType | None = Query(None),
    pc_needed: bool | None = Query(None),
    projector_needed: bool | None = Query(None),
    min_class_hours: int | None = Query(None, ge=0),
    max_class_hours: int | None = Query(None, ge=0),
    min_group_size: int | None = Query(None, gt=0),
    max_group_size: int | None = Query(None, gt=0),
    limit: int | None = Query(COURSE_TYPE_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("course-types:view")),
):
    query = db.query(models.Course_type_detail)

    if course is not None:
        query = query.filter(models.Course_type_detail.course == course)
    if class_type is not None:
        query = query.filter(models.Course_type_detail.class_type == class_type)
    if pc_needed is not None:
        query = query.filter(models.Course_type_detail.pc_needed == pc_needed)
    if projector_needed is not None:
        query = query.filter(
            models.Course_type_detail.projector_needed == projector_needed
        )
    if min_class_hours is not None:
        query = query.filter(models.Course_type_detail.class_hours >= min_class_hours)
    if max_class_hours is not None:
        query = query.filter(models.Course_type_detail.class_hours <= max_class_hours)
    if min_group_size is not None:
        query = query.filter(
            models.Course_type_detail.max_group_participants_number >= min_group_size
        )
    if max_group_size is not None:
        query = query.filter(
            models.Course_type_detail.max_group_participants_number <= max_group_size
        )

    query = query.order_by(
        models.Course_type_detail.course,
        models.Course_type_detail.class_type,
    )

    return paginate(
        query,
        limit,
        offset,
        order_by=[
            models.Course_type_detail.course,
            models.Course_type_detail.class_type,
        ],
    )


@router.get("/types/{course}/{class_type}", response_model=schemas.CourseTypeDetailRead)
def get_course_type(
    course: int,
    class_type: schemas.ClassType,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("course-type:view")),
):
    return _get_by_fields_or_404(
        db,
        models.Course_type_detail,
        "Course Type",
        course=course,
        class_type=class_type,
    )


@router.patch(
    "/types/{course}/{class_type}", response_model=schemas.CourseTypeDetailRead
)
def update_course_type(
    course: int,
    class_type: schemas.ClassType,
    payload: schemas.CourseTypeDetailUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("course-type:update")
    ),
):
    obj = _get_by_fields_or_404(
        db,
        models.Course_type_detail,
        "Course Type",
        course=course,
        class_type=class_type,
    )
    _apply_patch_or_reject_nulls(obj, payload, nullable_fields={"manual_weeks"})
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/types/{course}/{class_type}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course_type(
    course: int,
    class_type: schemas.ClassType,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("course-type:delete")
    ),
):
    obj = _get_by_fields_or_404(
        db,
        models.Course_type_detail,
        "Course Type",
        course=course,
        class_type=class_type,
    )
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Courses Instructors
@router.post(
    "/instructors",
    response_model=schemas.CourseInstructorRead,
    status_code=status.HTTP_201_CREATED,
)
def create_course_instructor(
    payload: schemas.CourseInstructorCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("instructor:create")),
):
    obj = models.Courses_instructors(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get(
    "/instructors",
    response_model=PaginatedResponse[schemas.CourseInstructorRead],
)
def list_course_instructors(
    employee: int | None = Query(None),
    course: int | None = Query(None),
    class_type: schemas.ClassType | None = Query(None),
    min_hours: int | None = Query(None, ge=0),
    max_hours: int | None = Query(None, ge=0),
    limit: int | None = Query(COURSE_INSTRUCTOR_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("instructors:view")),
):
    query = db.query(models.Courses_instructors)

    if employee is not None:
        query = query.filter(models.Courses_instructors.employee == employee)
    if course is not None:
        query = query.filter(models.Courses_instructors.course == course)
    if class_type is not None:
        query = query.filter(models.Courses_instructors.class_type == class_type)
    if min_hours is not None:
        query = query.filter(models.Courses_instructors.hours >= min_hours)
    if max_hours is not None:
        query = query.filter(models.Courses_instructors.hours <= max_hours)

    query = query.order_by(
        models.Courses_instructors.employee,
        models.Courses_instructors.course,
        models.Courses_instructors.class_type,
    )

    return paginate(
        query,
        limit,
        offset,
        order_by=[
            models.Courses_instructors.employee,
            models.Courses_instructors.course,
            models.Courses_instructors.class_type,
        ],
    )


@router.get(
    "/instructors/{employee}/{course}/{class_type}",
    response_model=schemas.CourseInstructorRead,
)
def get_course_instructor(
    employee: int,
    course: int,
    class_type: schemas.ClassType,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("instructor:view")),
):
    return _get_by_fields_or_404(
        db,
        models.Courses_instructors,
        "Course Instructor",
        employee=employee,
        course=course,
        class_type=class_type,
    )


@router.patch(
    "/instructors/{employee}/{course}/{class_type}",
    response_model=schemas.CourseInstructorRead,
)
def update_course_instructor(
    employee: int,
    course: int,
    class_type: schemas.ClassType,
    payload: schemas.CourseInstructorUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("instructor:update")),
):
    obj = _get_by_fields_or_404(
        db,
        models.Courses_instructors,
        "Course Instructor",
        employee=employee,
        course=course,
        class_type=class_type,
    )
    _apply_patch_or_reject_nulls(obj, payload)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete(
    "/instructors/{employee}/{course}/{class_type}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_course_instructor(
    employee: int,
    course: int,
    class_type: schemas.ClassType,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("instructor:delete")),
):
    obj = _get_by_fields_or_404(
        db,
        models.Courses_instructors,
        "Course Instructor",
        employee=employee,
        course=course,
        class_type=class_type,
    )
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Study Programs
def _get_semester_summary(
    db: Session, program_id: int, max_sem: int | None = None
) -> list[schemas.SemesterSummary]:
    if max_sem is None:
        max_sem = (
            db.query(func.coalesce(func.max(models.Curriculum_course.semester), 0))
            .filter(models.Curriculum_course.study_program == program_id)
            .scalar()
        ) or 0

    rows = (
        db.query(
            models.Curriculum_course.semester.label("semester"),
            func.count(models.Curriculum_course.course).label("courses_count"),
            func.coalesce(func.sum(models.Course.ects_points), 0).label("ects_sum"),
        )
        .join(
            models.Course, models.Curriculum_course.course == models.Course.course_code
        )
        .filter(models.Curriculum_course.study_program == program_id)
        .group_by(models.Curriculum_course.semester)
        .order_by(models.Curriculum_course.semester)
        .all()
    )

    per_sem = {
        r.semester: {"courses_count": r.courses_count, "ects_sum": r.ects_sum or 0}
        for r in rows
    }

    semester_summary = []
    for s in range(1, (max_sem or 0) + 1):
        entry = per_sem.get(s, {"courses_count": 0, "ects_sum": 0})
        semester_summary.append(
            schemas.SemesterSummary(
                semester_number=s,
                courses_count=entry["courses_count"],
                ects_sum=entry["ects_sum"],
            )
        )
    return semester_summary


@router.post(
    "/study-programs",
    response_model=schemas.StudyProgramRead,
    status_code=status.HTTP_201_CREATED,
)
def create_study_program(
    payload: schemas.StudyProgramCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("study-program:create")
    ),
):
    obj = models.Study_program(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get(
    "/study-programs",
    response_model=PaginatedResponse[schemas.StudyProgramDetailRead],
)
def list_study_programs(
    study_field: int | None = Query(None),
    start_year: str | None = Query(None, min_length=1),
    program_name: str | None = Query(None, min_length=1),
    limit: int | None = Query(STUDY_PROGRAM_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("study-programs:view")
    ),
    search: str | None = Query(None, min_length=1),
):
    semesters_sq = (
        db.query(func.max(models.Curriculum_course.semester))
        .filter(models.Curriculum_course.study_program == models.Study_program.id)
        .scalar_subquery()
    )

    query = db.query(
        models.Study_program, func.coalesce(semesters_sq, 0).label("semesters_count")
    )
    count_query = db.query(models.Study_program.id)

    if study_field is not None:
        filter_stmt = models.Study_program.study_field == study_field
        query = query.filter(filter_stmt)
        count_query = count_query.filter(filter_stmt)
    if start_year is not None:
        f = models.Study_program.start_year.ilike(f"%{start_year}%")
        query, count_query = query.filter(f), count_query.filter(f)
    if program_name is not None:
        f = models.Study_program.program_name.ilike(f"%{program_name}%")
        query, count_query = query.filter(f), count_query.filter(f)

    if search:
        f = build_ilike_search_filter(
            search,
            columns=[
                models.Study_program.program_name,
                models.Study_program.start_year,
            ],
        )
        if f is not None:
            query = query.filter(f)
            count_query = count_query.filter(f)

    pagination_result = paginate(
        query,
        limit,
        offset,
        order_by=models.Study_program.id,
        count_query=count_query,
    )

    items = []
    for row in pagination_result.items:
        study_program_obj, semesters_count = row
        items.append(
            schemas.StudyProgramDetailRead(
                id=study_program_obj.id,
                study_field=study_program_obj.study_field,
                start_year=study_program_obj.start_year,
                program_name=study_program_obj.program_name,
                semesters_count=semesters_count or 0,
                semester_summary=[],
            )
        )
    pagination_result.items = items

    return pagination_result


@router.get(
    "/study-programs/{program_id}", response_model=schemas.StudyProgramDetailRead
)
def get_study_program(
    program_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("study-program:view")
    ),
):
    semesters_sq = (
        db.query(func.max(models.Curriculum_course.semester))
        .filter(models.Curriculum_course.study_program == models.Study_program.id)
        .scalar_subquery()
    )

    row = (
        db.query(
            models.Study_program,
            func.coalesce(semesters_sq, 0).label("semesters_count"),
        )
        .filter(models.Study_program.id == program_id)
        .first()
    )

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="StudyProgram not found"
        )

    max_sem = int(row.semesters_count or 0)
    semester_summary = _get_semester_summary(db, program_id, max_sem)

    return schemas.StudyProgramDetailRead(
        id=row.Study_program.id,
        study_field=row.Study_program.study_field,
        start_year=row.Study_program.start_year,
        program_name=row.Study_program.program_name,
        semesters_count=row.semesters_count or 0,
        semester_summary=semester_summary,
    )


@router.get(
    "/study-programs/{program_id}/semester-summary",
    response_model=list[schemas.SemesterSummary],
)
def get_program_semester_summary(
    program_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("study-program:view")
    ),
):
    _get_or_404(db, models.Study_program, program_id, "Study Program")
    return _get_semester_summary(db, program_id)


@router.patch("/study-programs/{program_id}", response_model=schemas.StudyProgramRead)
def update_study_program(
    program_id: int,
    payload: schemas.StudyProgramUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("study-program:update")
    ),
):
    obj = _get_or_404(db, models.Study_program, program_id, "Study Program")
    _apply_patch_or_reject_nulls(obj, payload, nullable_fields={"program_name"})
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/study-programs/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_program(
    program_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("study-program:delete")
    ),
):
    obj = _get_or_404(db, models.Study_program, program_id, "Study Program")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Curriculum
@router.post(
    "/curriculum",
    response_model=schemas.CurriculumCourseRead,
    status_code=status.HTTP_201_CREATED,
)
def create_curriculum_course(
    payload: schemas.CurriculumCourseCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("curriculum:create")),
):
    obj = models.Curriculum_course(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get(
    "/curriculum", response_model=PaginatedResponse[schemas.CurriculumCourseNested]
)
def list_curriculum(
    study_program: int | None = Query(None),
    course: int | None = Query(None),
    semester: int | None = Query(None, gt=0),
    major: int | None = Query(None),
    elective_block: int | None = Query(None),
    limit: int | None = Query(CURRICULUM_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("curriculums:view")),
):
    groups_subq = (
        db.query(func.count(ac_models.Groups.id))
        .filter(ac_models.Groups.major == models.Major.id)
        .scalar_subquery()
    )

    q = (
        db.query(
            models.Curriculum_course,
            models.Course,
            models.Major,
            models.Elective_block,
            func.coalesce(groups_subq, 0).label("major_group_count"),
        )
        .join(
            models.Course, models.Curriculum_course.course == models.Course.course_code
        )
        .outerjoin(models.Major, models.Curriculum_course.major == models.Major.id)
        .outerjoin(
            models.Elective_block,
            models.Curriculum_course.elective_block == models.Elective_block.id,
        )
    )

    if study_program is not None:
        q = q.filter(models.Curriculum_course.study_program == study_program)
    if course is not None:
        q = q.filter(models.Curriculum_course.course == course)
    if semester is not None:
        q = q.filter(models.Curriculum_course.semester == semester)
    if major is not None:
        q = q.filter(models.Curriculum_course.major == major)
    if elective_block is not None:
        q = q.filter(models.Curriculum_course.elective_block == elective_block)

    paginated = paginate(
        q,
        limit,
        offset,
        order_by=[
            models.Curriculum_course.study_program,
            models.Curriculum_course.course,
            models.Curriculum_course.semester,
        ],
    )

    items = []
    for row in paginated.items:
        cc, course_obj, major_obj, block_obj, major_group_count = row
        items.append(
            schemas.CurriculumCourseNested(
                study_program=cc.study_program,
                course=cc.course,
                semester=cc.semester,
                major=cc.major,
                elective_block=cc.elective_block,
                course_details=schemas.CourseSummary(
                    course_code=course_obj.course_code,
                    course_name=course_obj.course_name,
                    ects_points=course_obj.ects_points,
                ),
                major_details=(
                    schemas.MajorRead(
                        id=major_obj.id,
                        study_field=major_obj.study_field,
                        major_name=major_obj.major_name,
                        group_count=major_group_count,
                    )
                    if major_obj
                    else None
                ),
                elective_block_details=(
                    schemas.ElectiveBlockRead(
                        id=block_obj.id,
                        study_field=block_obj.study_field,
                        elective_block_name=block_obj.elective_block_name,
                    )
                    if block_obj
                    else None
                ),
            )
        )

    paginated.items = items
    return paginated


@router.get(
    "/curriculum/{study_program}/{course}/{semester}",
    response_model=schemas.CurriculumCourseNested,
)
def get_curriculum_course(
    study_program: int,
    course: int,
    semester: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("curriculum:view")),
):
    groups_subq = (
        db.query(func.count(ac_models.Groups.id))
        .filter(ac_models.Groups.major == models.Major.id)
        .scalar_subquery()
    )

    row = (
        db.query(
            models.Curriculum_course,
            models.Course,
            models.Major,
            models.Elective_block,
            func.coalesce(groups_subq, 0).label("major_group_count"),
        )
        .join(
            models.Course, models.Curriculum_course.course == models.Course.course_code
        )
        .outerjoin(models.Major, models.Curriculum_course.major == models.Major.id)
        .outerjoin(
            models.Elective_block,
            models.Curriculum_course.elective_block == models.Elective_block.id,
        )
        .filter(
            models.Curriculum_course.study_program == study_program,
            models.Curriculum_course.course == course,
            models.Curriculum_course.semester == semester,
        )
        .one_or_none()
    )

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Curriculum course not found"
        )

    cc, course_obj, major_obj, block_obj, major_group_count = row
    return schemas.CurriculumCourseNested(
        study_program=cc.study_program,
        course=cc.course,
        semester=cc.semester,
        major=cc.major,
        elective_block=cc.elective_block,
        course_details=schemas.CourseSummary(
            course_code=course_obj.course_code,
            course_name=course_obj.course_name,
            ects_points=course_obj.ects_points,
        ),
        major_details=(
            schemas.MajorRead(
                id=major_obj.id,
                study_field=major_obj.study_field,
                major_name=major_obj.major_name,
                group_count=major_group_count,
            )
            if major_obj
            else None
        ),
        elective_block_details=(
            schemas.ElectiveBlockRead(
                id=block_obj.id,
                study_field=block_obj.study_field,
                elective_block_name=block_obj.elective_block_name,
            )
            if block_obj
            else None
        ),
    )


@router.patch(
    "/curriculum/{study_program}/{course}/{semester}",
    response_model=schemas.CurriculumCourseRead,
)
def update_curriculum_course(
    study_program: int,
    course: int,
    semester: int,
    payload: schemas.CurriculumCourseUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("curriculum:update")),
):
    obj = _get_by_fields_or_404(
        db,
        models.Curriculum_course,
        "Curriculum Course",
        study_program=study_program,
        course=course,
        semester=semester,
    )
    _apply_patch_or_reject_nulls(
        obj, payload, nullable_fields={"major", "elective_block"}
    )
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete(
    "/curriculum/{study_program}/{course}/{semester}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_curriculum(
    study_program: int,
    course: int,
    semester: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("curriculum:delete")),
):
    obj = _get_by_fields_or_404(
        db,
        models.Curriculum_course,
        "Curriculum Course",
        study_program=study_program,
        course=course,
        semester=semester,
    )
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Course
@router.post(
    "/", response_model=schemas.CourseRead, status_code=status.HTTP_201_CREATED
)
def create_course(
    payload: schemas.CourseCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("course:create")),
):
    obj = models.Course(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/", response_model=PaginatedResponse[schemas.CourseRead])
def list_courses(
    course_name: str | None = Query(None, min_length=1),
    course_language: models.CourseLanguage | None = Query(None),
    leading_unit: int | None = Query(None),
    course_coordinator: int | None = Query(None),
    min_ects_points: int | None = Query(None, ge=0),
    max_ects_points: int | None = Query(None, ge=0),
    limit: int | None = Query(COURSE_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("courses:view")),
    search: str | None = Query(None, min_length=1),
):
    query = db.query(models.Course)
    count_query = db.query(models.Course.course_code)

    filters = []
    if course_name is not None:
        filters.append(models.Course.course_name.ilike(f"%{course_name}%"))
    if course_language is not None:
        filters.append(models.Course.course_language == course_language)
    if leading_unit is not None:
        filters.append(models.Course.leading_unit == leading_unit)
    if course_coordinator is not None:
        filters.append(models.Course.course_coordinator == course_coordinator)
    if min_ects_points is not None:
        filters.append(models.Course.ects_points >= min_ects_points)
    if max_ects_points is not None:
        filters.append(models.Course.ects_points <= max_ects_points)

    query, count_query = apply_filters_to_queries(query, count_query, filters)

    query, count_query = apply_search_to_queries(
        search, query, count_query, [models.Course.course_name]
    )

    pagination_result = paginate(
        query,
        limit,
        offset,
        order_by=models.Course.course_code,
        count_query=count_query,
    )

    return pagination_result


@router.get("/{course_code}", response_model=schemas.CourseRead)
def get_course(
    course_code: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("course:view")),
):
    return _get_or_404(db, models.Course, course_code, "Course")


@router.patch("/{course_code}", response_model=schemas.CourseRead)
def update_course(
    course_code: int,
    payload: schemas.CourseUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("course:update")),
):
    obj = _get_or_404(db, models.Course, course_code, "Course")
    _apply_patch_or_reject_nulls(
        obj, payload, nullable_fields={"major", "elective_block"}
    )
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/{course_code}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    course_code: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("course:delete")),
):
    obj = _get_or_404(db, models.Course, course_code, "Course")
    db.delete(obj)
    _commit_or_rollback(db)
    return None
