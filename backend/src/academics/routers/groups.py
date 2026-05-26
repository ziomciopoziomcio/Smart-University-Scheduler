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
    apply_search_to_queries,
)
from .. import models, schemas
from ...database.database import get_db
from ...common.require_permission import require_permission
from ...users import models as user_models
from ...courses import models as course_models

router = APIRouter(tags=["academics - groups"])

GROUP_LIMIT = 100
GROUP_MEMBER_LIMIT = 100


# Groups
@router.post(
    "/groups", response_model=schemas.GroupsRead, status_code=status.HTTP_201_CREATED
)
def create_group(
    payload: schemas.GroupsCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("group:create")),
):
    obj = models.Groups(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/groups", response_model=PaginatedResponse[schemas.GroupsRead])
def list_groups(
    study_program: int | None = Query(None),
    major: int | None = Query(None),
    elective_block: int | None = Query(None),
    is_active: bool | None = Query(None),
    group_name: str | None = Query(None, min_length=1),
    limit: int | None = Query(GROUP_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("groups:view")),
    search: str | None = Query(None),
):
    members_subq = (
        db.query(func.count(models.Group_members.student))
        .filter(models.Group_members.group == models.Groups.id)
        .scalar_subquery()
    )

    query = db.query(
        models.Groups, func.coalesce(members_subq, 0).label("students_count")
    )
    count_query = db.query(models.Groups.id)

    filter_map = {
        models.Groups.study_program: study_program,
        models.Groups.major: major,
        models.Groups.elective_block: elective_block,
        models.Groups.is_active: is_active,
    }
    filters = [col == val for col, val in filter_map.items() if val is not None]

    if group_name is not None:
        filters.append(models.Groups.group_name.ilike(f"%{group_name}%"))

    if filters:
        query = query.filter(*filters)

    query, count_query = apply_search_to_queries(
        search=search,
        query=query,
        count_query=count_query,
        columns=[models.Groups.group_name],
    )

    pagination_result = paginate(
        query, limit, offset, models.Groups.id, count_query=count_query
    )

    pagination_result.items = [
        schemas.GroupsRead(
            id=group_obj.id,
            group_name=group_obj.group_name,
            study_program=group_obj.study_program,
            major=group_obj.major,
            elective_block=group_obj.elective_block,
            semester=group_obj.semester,
            is_active=is_active,
            students_count=int(students_count or 0),
        )
        for group_obj, students_count in pagination_result.items
    ]
    return pagination_result


def _build_groups_summary_query(
    db: Session,
    faculty_id: int,
    study_field: int,
    semester: int,
    specialization_id: int | None,
    elective_block_id: int | None,
    is_active: bool | None,
):
    """
    Builds the base query for fetching study plan groups summary based on the provided filters.
    :param db: Session
    :param faculty_id: Faculty id
    :param study_field: Study field id
    :param semester: Semester number
    :param specialization_id: Specialization id (optional)
    :param elective_block_id: Elective block id (optional)
    :param is_active: active status of group (optional)
    :return: SQLAlchemy query object
    """
    query = (
        db.query(models.Groups, course_models.Study_program)
        .join(
            course_models.Study_program,
            models.Groups.study_program == course_models.Study_program.id,
        )
        .join(
            course_models.Study_fields,
            course_models.Study_program.study_field == course_models.Study_fields.id,
        )
        .filter(
            course_models.Study_fields.faculty == faculty_id,
            course_models.Study_fields.id == study_field,
            models.Groups.semester == semester,
        )
    )

    if specialization_id is None and elective_block_id is None:
        query = query.filter(
            models.Groups.major.is_(None), models.Groups.elective_block.is_(None)
        )
    elif specialization_id is not None:
        query = query.filter(models.Groups.major == specialization_id)
    elif elective_block_id is not None:
        query = query.filter(models.Groups.elective_block == elective_block_id)

    if is_active is not None:
        query = query.filter(models.Groups.is_active == is_active)

    return query


@router.get("/groups/summary", response_model=list[schemas.StudyPlanGroupSummary])
def get_study_plan_groups_summary(
    faculty_id: int = Query(...),
    study_field: int = Query(...),
    semester: int = Query(..., gt=0),
    specialization_id: int | None = Query(None),
    elective_block_id: int | None = Query(None),
    is_active: bool | None = Query(None),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("groups:view")),
):
    """
    Get study plan groups summary
    :param faculty_id: ID of faculty
    :param study_field: ID of study field
    :param semester: ID of semester
    :param specialization_id: ID of specialization (optional)
    :param elective_block_id: ID of elective block (optional)
    :param is_active: active status of group (optional)
    :param db: Session
    :param _current_user: Current user
    :return: List of study plan groups summary
    """
    if specialization_id is not None and elective_block_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot filter by both specialization and elective block",
        )

    query = _build_groups_summary_query(
        db,
        faculty_id,
        study_field,
        semester,
        specialization_id,
        elective_block_id,
        is_active,
    )

    return [
        schemas.StudyPlanGroupSummary(
            id=group.id,
            group_name=group.group_name,
            academic_year=study_prog.start_year,
        )
        for group, study_prog in query.distinct().limit(1000).all()
    ]


@router.get("/groups/{group_id}", response_model=schemas.GroupsRead)
def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("group:view")),
):
    members_subq = (
        db.query(func.count(models.Group_members.student))
        .filter(models.Group_members.group == models.Groups.id)
        .scalar_subquery()
    )

    row = (
        db.query(models.Groups, func.coalesce(members_subq, 0).label("students_count"))
        .filter(models.Groups.id == group_id)
        .one_or_none()
    )
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Group not found"
        )

    group_obj, students_count = row
    return schemas.GroupsRead(
        id=group_obj.id,
        group_name=group_obj.group_name,
        study_program=group_obj.study_program,
        major=group_obj.major,
        elective_block=group_obj.elective_block,
        semester=group_obj.semester,
        is_active=group_obj.is_active,
        students_count=int(students_count or 0),
    )


@router.patch("/groups/{group_id}", response_model=schemas.GroupsRead)
def update_group(
    group_id: int,
    payload: schemas.GroupsUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("group:update")),
):
    obj = _get_or_404(db, models.Groups, group_id, "Group")
    _apply_patch_or_reject_nulls(
        obj, payload, nullable_fields={"major", "elective_block"}
    )

    if obj.major is not None and obj.elective_block is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="`major` and `elective_block` cannot both be set",
        )
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("group:delete")),
):
    obj = _get_or_404(db, models.Groups, group_id, "Group")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Group Members
@router.post(
    "/group-members",
    response_model=schemas.GroupMembersRead,
    status_code=status.HTTP_201_CREATED,
)
def create_group_member(
    payload: schemas.GroupMembersCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("group-member:create")
    ),
):
    obj = models.Group_members(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get(
    "/group-members",
    response_model=PaginatedResponse[schemas.GroupMembersRead],
)
def list_group_members(
    group: int | None = Query(None),
    student: int | None = Query(None),
    limit: int | None = Query(GROUP_MEMBER_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("group-members:view")
    ),
):
    query = db.query(models.Group_members)

    if group is not None:
        query = query.filter(models.Group_members.group == group)
    if student is not None:
        query = query.filter(models.Group_members.student == student)

    query = query.order_by(
        models.Group_members.group,
        models.Group_members.student,
    )

    return paginate(
        query,
        limit,
        offset,
        order_by=[models.Group_members.group, models.Group_members.student],
    )


@router.get(
    "/group-members/{group_id}/{student_id}", response_model=schemas.GroupMembersRead
)
def get_group_member(
    group_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("group-member:view")),
):
    return _get_by_fields_or_404(
        db,
        models.Group_members,
        "Group Member",
        group=group_id,
        student=student_id,
    )


@router.patch(
    "/group-members/{group_id}/{student_id}", response_model=schemas.GroupMembersRead
)
def update_group_member(
    group_id: int,
    student_id: int,
    payload: schemas.GroupMembersUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("group-member:update")
    ),
):
    obj = _get_by_fields_or_404(
        db,
        models.Group_members,
        "Group Member",
        group=group_id,
        student=student_id,
    )
    _apply_patch_or_reject_nulls(obj, payload)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete(
    "/group-members/{group_id}/{student_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_group_member(
    group_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(
        require_permission("group-member:delete")
    ),
):
    obj = _get_by_fields_or_404(
        db,
        models.Group_members,
        "Group Member",
        group=group_id,
        student=student_id,
    )
    db.delete(obj)
    _commit_or_rollback(db)
    return None
