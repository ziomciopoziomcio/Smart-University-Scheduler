from collections import defaultdict

from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from src.common.pagination.pagination import paginate
from src.common.pagination.pagination_model import PaginatedResponse
from src.common.router_utils import (
    _get_or_404,
    _commit_or_rollback,
    _apply_patch_or_reject_nulls,
    serialize_student_nested,
    build_ilike_search_filter,
)
from .. import models, schemas
from ...database.database import get_db
from ...common.require_permission import require_permission
from ...users import models as user_models
from ...courses import models as course_models

STUDENT_LIMIT = 100

router = APIRouter(tags=["academics - students"])


# Students
@router.post(
    "/students", response_model=schemas.StudentRead, status_code=status.HTTP_201_CREATED
)
def create_student(
    payload: schemas.StudentCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("student:create")),
):
    obj = models.Students(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/students", response_model=PaginatedResponse[schemas.StudentNested])
def list_students(
    user_id: int | None = Query(None),
    study_program: int | None = Query(None),
    major: int | None = Query(None),
    limit: int = Query(STUDENT_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("students:view")),
    search: str | None = Query(None),
):
    filters = []
    if user_id is not None:
        filters.append(models.Students.user_id == user_id)
    if study_program is not None:
        filters.append(models.Students.study_program == study_program)
    if major is not None:
        filters.append(models.Students.major == major)

    count_q = db.query(models.Students)
    if filters:
        count_q = count_q.filter(*filters)

    joined_q = (
        db.query(
            models.Students,
            user_models.Users,
            course_models.Study_program,
            course_models.Study_fields,
            course_models.Major,
        )
        .join(user_models.Users, models.Students.user_id == user_models.Users.id)
        .join(
            course_models.Study_program,
            models.Students.study_program == course_models.Study_program.id,
        )
        .join(
            course_models.Study_fields,
            course_models.Study_program.study_field == course_models.Study_fields.id,
        )
        .outerjoin(course_models.Major, models.Students.major == course_models.Major.id)
    )

    trimmed_search = (search or "").strip()
    if trimmed_search:
        search_filter = build_ilike_search_filter(
            trimmed_search,
            columns=[
                user_models.Users.name,
                user_models.Users.surname,
                user_models.Users.email,
                user_models.Users.degree,
            ],
            extra_phrase_columns=[
                func.concat(user_models.Users.name, " ", user_models.Users.surname),
                func.concat(user_models.Users.surname, " ", user_models.Users.name),
            ],
        )
        if search_filter is not None:
            count_q = count_q.join(
                user_models.Users, models.Students.user_id == user_models.Users.id
            ).filter(search_filter)
            joined_q = joined_q.filter(search_filter)

    if filters:
        joined_q = joined_q.filter(*filters)

    paginated = paginate(
        joined_q,
        limit=limit,
        offset=offset,
        order_by=models.Students.id,
        count_query=count_q,
    )

    rows = paginated.items
    total = paginated.total

    student_ids = [row[0].id for row in rows]
    student_groups_map = defaultdict(list)

    if student_ids:
        groups_data = (
            db.query(models.Group_members.student, models.Groups)
            .join(models.Groups, models.Group_members.group == models.Groups.id)
            .filter(models.Group_members.student.in_(student_ids))
            .all()
        )
        for student_id, group_obj in groups_data:
            student_groups_map[student_id].append(group_obj)

    items = [
        serialize_student_nested(row, student_groups_map.get(row[0].id, []))
        for row in rows
    ]
    return PaginatedResponse(items=items, total=total, limit=limit, offset=offset)


@router.get("/students/{student_id}", response_model=schemas.StudentNested)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("student:view")),
):
    row = (
        db.query(
            models.Students,
            user_models.Users,
            course_models.Study_program,
            course_models.Study_fields,
            course_models.Major,
        )
        .join(user_models.Users, models.Students.user_id == user_models.Users.id)
        .join(
            course_models.Study_program,
            models.Students.study_program == course_models.Study_program.id,
        )
        .join(
            course_models.Study_fields,
            course_models.Study_program.study_field == course_models.Study_fields.id,
        )
        .outerjoin(course_models.Major, models.Students.major == course_models.Major.id)
        .filter(models.Students.id == student_id)
        .one_or_none()
    )
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student not found"
        )

    groups_data = (
        db.query(models.Groups)
        .join(models.Group_members, models.Group_members.group == models.Groups.id)
        .filter(models.Group_members.student == student_id)
        .all()
    )

    return serialize_student_nested(row, groups_data)


@router.patch("/students/{student_id}", response_model=schemas.StudentRead)
def update_student(
    student_id: int,
    payload: schemas.StudentUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("student:update")),
):
    obj = _get_or_404(db, models.Students, student_id, "Student")
    _apply_patch_or_reject_nulls(obj, payload, nullable_fields={"major"})
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("student:delete")),
):
    obj = _get_or_404(db, models.Students, student_id, "Student")
    db.delete(obj)
    _commit_or_rollback(db)
    return None
