from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from . import models, schemas
from ..database.database import get_db
from src.common.router_utils import (
    _get_or_404,
    _commit_or_rollback,
    _apply_patch_or_reject_nulls,
)
from src.common.pagination.pagination import paginate
from src.common.pagination.pagination_model import PaginatedResponse

router = APIRouter(prefix="/facilities", tags=["facilities"])

CAMPUS_LIMIT = 100
BUILDING_LIMIT = 100
ROOM_LIMIT = 100
FACULTY_LIMIT = 100

# Campuses
@router.post(
    "/campuses", response_model=schemas.CampusRead, status_code=status.HTTP_201_CREATED
)
def create_campus(payload: schemas.CampusCreate, db: Session = Depends(get_db)):
    new_campus = models.Campus(**payload.model_dump())
    db.add(new_campus)
    _commit_or_rollback(db)
    db.refresh(new_campus)
    return new_campus


@router.get("/campuses", response_model=PaginatedResponse[schemas.CampusRead])
def list_campuses(
    limit: int | None = Query(CAMPUS_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(models.Campus)
    return paginate(query, limit, offset, models.Campus.id)


@router.get("/campuses/{campus_id}", response_model=schemas.CampusRead)
def get_campus(campus_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Campus, campus_id, "Campus")


@router.patch("/campuses/{campus_id}", response_model=schemas.CampusRead)
def update_campus(
    campus_id: int, payload: schemas.CampusUpdate, db: Session = Depends(get_db)
):
    obj = _get_or_404(db, models.Campus, campus_id, "Campus")
    _apply_patch_or_reject_nulls(obj, payload, nullable_fields=["campus_name"])
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/campuses/{campus_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campus(campus_id: int, db: Session = Depends(get_db)):
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
def create_building(payload: schemas.BuildingCreate, db: Session = Depends(get_db)):
    new_building = models.Building(**payload.model_dump())
    db.add(new_building)
    _commit_or_rollback(db)
    db.refresh(new_building)
    return new_building


@router.get("/buildings", response_model=PaginatedResponse[schemas.BuildingRead])
def list_buildings(
    limit: int | None = Query(BUILDING_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(models.Building)
    return paginate(query, limit, offset, models.Building.id)


@router.get("/buildings/{building_id}", response_model=schemas.BuildingRead)
def get_building(building_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Building, building_id, "Building")


@router.patch("/buildings/{building_id}", response_model=schemas.BuildingRead)
def update_building(
    building_id: int, payload: schemas.BuildingUpdate, db: Session = Depends(get_db)
):
    obj = _get_or_404(db, models.Building, building_id, "Building")
    _apply_patch_or_reject_nulls(obj, payload, nullable_fields=["building_name"])
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/buildings/{building_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_building(building_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Building, building_id, "Building")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Rooms
@router.post(
    "/rooms", response_model=schemas.RoomRead, status_code=status.HTTP_201_CREATED
)
def create_room(payload: schemas.RoomCreate, db: Session = Depends(get_db)):
    new_room = models.Room(**payload.model_dump())
    db.add(new_room)
    _commit_or_rollback(db)
    db.refresh(new_room)
    return new_room


@router.get("/rooms", response_model=PaginatedResponse[schemas.RoomRead])
def list_rooms(
    limit: int | None = Query(ROOM_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(models.Room)
    return paginate(query, limit, offset, models.Room.id)


@router.get("/rooms/{room_id}", response_model=schemas.RoomRead)
def get_room(room_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Room, room_id, "Room")


@router.patch("/rooms/{room_id}", response_model=schemas.RoomRead)
def update_room(
    room_id: int, payload: schemas.RoomUpdate, db: Session = Depends(get_db)
):
    obj = _get_or_404(db, models.Room, room_id, "Room")
    _apply_patch_or_reject_nulls(obj, payload, nullable_fields=["unit_id"])
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/rooms/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(room_id: int, db: Session = Depends(get_db)):
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
def create_faculty(payload: schemas.FacultyCreate, db: Session = Depends(get_db)):
    new_faculty = models.Faculty(**payload.model_dump())
    db.add(new_faculty)
    _commit_or_rollback(db)
    db.refresh(new_faculty)
    return new_faculty


@router.get("/faculties", response_model=PaginatedResponse[schemas.FacultyRead])
def list_faculties(
    limit: int | None = Query(FACULTY_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(models.Faculty)
    return paginate(query, limit, offset, models.Faculty.id)


@router.get("/faculties/{faculty_id}", response_model=schemas.FacultyRead)
def get_faculty(faculty_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Faculty, faculty_id, "Faculty")


@router.patch("/faculties/{faculty_id}", response_model=schemas.FacultyRead)
def update_faculty(
    faculty_id: int, payload: schemas.FacultyUpdate, db: Session = Depends(get_db)
):
    obj = _get_or_404(db, models.Faculty, faculty_id, "Faculty")
    _apply_patch_or_reject_nulls(obj, payload)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/faculties/{faculty_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_faculty(faculty_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Faculty, faculty_id, "Faculty")
    db.delete(obj)
    _commit_or_rollback(db)
    return None
