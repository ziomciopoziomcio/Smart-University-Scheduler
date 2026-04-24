from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from . import models, schemas
from ..database.database import get_db
from src.common.router_utils import (
    _get_or_404,
    _commit_or_rollback,
    _apply_patch_or_reject_nulls,
    build_ilike_search_filter,
)
from src.common.pagination.pagination import paginate
from src.common.pagination.pagination_model import PaginatedResponse
from ..common.require_permission import require_permission
from ..users import models as user_models

router = APIRouter(prefix="/facilities", tags=["facilities"])

CAMPUS_LIMIT = 100
BUILDING_LIMIT = 100
ROOM_LIMIT = 100
FACULTY_LIMIT = 100


# Campuses
@router.post(
    "/campuses", response_model=schemas.CampusRead, status_code=status.HTTP_201_CREATED
)
def create_campus(
    payload: schemas.CampusCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("campus:create")),
):
    new_campus = models.Campus(**payload.model_dump())
    db.add(new_campus)
    _commit_or_rollback(db)
    db.refresh(new_campus)
    return new_campus


@router.get("/campuses", response_model=PaginatedResponse[schemas.CampusRead])
def list_campuses(
    campus_name: str | None = Query(None, min_length=1),
    campus_short: str | None = Query(None, min_length=1),
    limit: int = Query(CAMPUS_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("campuses:view")),
    search: Optional[str] = Query(None),
):
    query = db.query(models.Campus)

    if campus_name is not None:
        query = query.filter(models.Campus.campus_name.ilike(f"%{campus_name}%"))
    if campus_short is not None:
        query = query.filter(models.Campus.campus_short.ilike(f"%{campus_short}%"))
    if search:
        f = build_ilike_search_filter(
            search, columns=[models.Campus.campus_name, models.Campus.campus_short]
        )
        if f is not None:
            query = query.filter(f)

    return paginate(query, limit, offset, models.Campus.id)


@router.get("/campuses/{campus_id}", response_model=schemas.CampusRead)
def get_campus(
    campus_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("campus:view")),
):
    return _get_or_404(db, models.Campus, campus_id, "Campus")


@router.patch("/campuses/{campus_id}", response_model=schemas.CampusRead)
def update_campus(
    campus_id: int,
    payload: schemas.CampusUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("campus:update")),
):
    obj = _get_or_404(db, models.Campus, campus_id, "Campus")
    _apply_patch_or_reject_nulls(obj, payload, nullable_fields=["campus_name"])
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/campuses/{campus_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campus(
    campus_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("campus:delete")),
):
    obj = _get_or_404(db, models.Campus, campus_id, "Campus")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Buildings
@router.post(
    "/buildings",
    response_model=schemas.BuildingRead,
    status_code=status.HTTP_201_CREATED,
)
def create_building(
    payload: schemas.BuildingCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("building:create")),
):
    new_building = models.Building(**payload.model_dump())
    db.add(new_building)
    _commit_or_rollback(db)
    db.refresh(new_building)
    return new_building


@router.get("/buildings", response_model=PaginatedResponse[schemas.BuildingRead])
def list_buildings(
    campus_id: int | None = Query(None),
    building_name: str | None = Query(None, min_length=1),
    building_number: str | None = Query(None, min_length=1),
    limit: int = Query(BUILDING_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("buildings:view")),
    search: Optional[str] = Query(None),
):
    query = db.query(models.Building)

    if campus_id is not None:
        query = query.filter(models.Building.campus_id == campus_id)
    if building_name is not None:
        query = query.filter(models.Building.building_name.ilike(f"%{building_name}%"))
    if building_number is not None:
        query = query.filter(
            models.Building.building_number.ilike(f"%{building_number}%")
        )
    if search:
        f = build_ilike_search_filter(
            search,
            columns=[models.Building.building_name, models.Building.building_number],
        )
        if f is not None:
            query = query.filter(f)

    return paginate(query, limit, offset, models.Building.id)


@router.get("/buildings/{building_id}", response_model=schemas.BuildingRead)
def get_building(
    building_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("building:view")),
):
    return _get_or_404(db, models.Building, building_id, "Building")


@router.patch("/buildings/{building_id}", response_model=schemas.BuildingRead)
def update_building(
    building_id: int,
    payload: schemas.BuildingUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("building:update")),
):
    obj = _get_or_404(db, models.Building, building_id, "Building")
    _apply_patch_or_reject_nulls(obj, payload, nullable_fields=["building_name"])
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/buildings/{building_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_building(
    building_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("building:delete")),
):
    obj = _get_or_404(db, models.Building, building_id, "Building")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Rooms
@router.post(
    "/rooms", response_model=schemas.RoomRead, status_code=status.HTTP_201_CREATED
)
def create_room(
    payload: schemas.RoomCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("room:create")),
):
    new_room = models.Room(**payload.model_dump())
    db.add(new_room)
    _commit_or_rollback(db)
    db.refresh(new_room)
    return new_room


@router.get("/rooms", response_model=PaginatedResponse[schemas.RoomRead])
def list_rooms(
    building_id: int | None = Query(None),
    faculty_id: int | None = Query(None),
    unit_id: int | None = Query(None),
    room_name: str | None = Query(None, min_length=1),
    projector_availability: bool | None = Query(None),
    min_pc_amount: int | None = Query(None, ge=0),
    max_pc_amount: int | None = Query(None, ge=0),
    min_room_capacity: int | None = Query(None, gt=0),
    max_room_capacity: int | None = Query(None, gt=0),
    limit: int = Query(ROOM_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("rooms:view")),
    search: Optional[str] = Query(None),
):
    query = db.query(models.Room)

    if building_id is not None:
        query = query.filter(models.Room.building_id == building_id)
    if faculty_id is not None:
        query = query.filter(models.Room.faculty_id == faculty_id)
    if unit_id is not None:
        query = query.filter(models.Room.unit_id == unit_id)
    if room_name is not None:
        query = query.filter(models.Room.room_name.ilike(f"%{room_name}%"))
    if projector_availability is not None:
        query = query.filter(
            models.Room.projector_availability == projector_availability
        )
    if min_pc_amount is not None:
        query = query.filter(models.Room.pc_amount >= min_pc_amount)
    if max_pc_amount is not None:
        query = query.filter(models.Room.pc_amount <= max_pc_amount)
    if min_room_capacity is not None:
        query = query.filter(models.Room.room_capacity >= min_room_capacity)
    if max_room_capacity is not None:
        query = query.filter(models.Room.room_capacity <= max_room_capacity)
    if search:
        f = build_ilike_search_filter(search, columns=[models.Room.room_name])
        if f is not None:
            query = query.filter(f)

    return paginate(query, limit, offset, models.Room.id)


@router.get("/rooms/{room_id}", response_model=schemas.RoomRead)
def get_room(
    room_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("room:view")),
):
    return _get_or_404(db, models.Room, room_id, "Room")


@router.patch("/rooms/{room_id}", response_model=schemas.RoomRead)
def update_room(
    room_id: int,
    payload: schemas.RoomUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("room:update")),
):
    obj = _get_or_404(db, models.Room, room_id, "Room")
    _apply_patch_or_reject_nulls(obj, payload, nullable_fields=["unit_id"])
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/rooms/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(
    room_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("room:delete")),
):
    obj = _get_or_404(db, models.Room, room_id, "Room")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Faculties
@router.post(
    "/faculties",
    response_model=schemas.FacultyRead,
    status_code=status.HTTP_201_CREATED,
)
def create_faculty(
    payload: schemas.FacultyCreate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("faculty:create")),
):
    new_faculty = models.Faculty(**payload.model_dump())
    db.add(new_faculty)
    _commit_or_rollback(db)
    db.refresh(new_faculty)
    return new_faculty


@router.get("/faculties", response_model=PaginatedResponse[schemas.FacultyRead])
def list_faculties(
    faculty_name: str | None = Query(None, min_length=1),
    faculty_short: str | None = Query(None, min_length=1),
    limit: int = Query(FACULTY_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("faculties:view")),
    search: Optional[str] = Query(None),
):
    query = db.query(models.Faculty)

    if faculty_name is not None:
        query = query.filter(models.Faculty.faculty_name.ilike(f"%{faculty_name}%"))
    if faculty_short is not None:
        query = query.filter(models.Faculty.faculty_short.ilike(f"%{faculty_short}%"))
    if search:
        f = build_ilike_search_filter(
            search, columns=[models.Faculty.faculty_name, models.Faculty.faculty_short]
        )
        if f is not None:
            query = query.filter(f)

    return paginate(query, limit, offset, models.Faculty.id)


@router.get("/faculties/{faculty_id}", response_model=schemas.FacultyRead)
def get_faculty(
    faculty_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("faculty:view")),
):
    return _get_or_404(db, models.Faculty, faculty_id, "Faculty")


@router.patch("/faculties/{faculty_id}", response_model=schemas.FacultyRead)
def update_faculty(
    faculty_id: int,
    payload: schemas.FacultyUpdate,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("faculty:update")),
):
    obj = _get_or_404(db, models.Faculty, faculty_id, "Faculty")
    _apply_patch_or_reject_nulls(obj, payload)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/faculties/{faculty_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_faculty(
    faculty_id: int,
    db: Session = Depends(get_db),
    _current_user: user_models.Users = Depends(require_permission("faculty:delete")),
):
    obj = _get_or_404(db, models.Faculty, faculty_id, "Faculty")
    db.delete(obj)
    _commit_or_rollback(db)
    return None
