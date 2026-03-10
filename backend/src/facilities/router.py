from typing import List, Any, Iterable
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session
import logging

from . import models, schemas
from ..database.database import get_db

router = APIRouter(prefix="/facilities", tags=["facilities"])
logger = logging.getLogger(__name__)

def _get_or_404(db: Session, model, obj_id: Any, name: str):
    obj = db.get(model, obj_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{name} not found")
    return obj

def _commit_or_rollback(db: Session):
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        logger.exception("Integrity error during commit")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="Conflict: request violates database constraints")
    except SQLAlchemyError:
        db.rollback()
        logger.exception("Unexpected database error during commit")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Internal server error")
    
def _apply_patch_or_reject_nulls(obj, payload, nullable_fields: Iterable[str] = ()):
    provided = payload.model_dump(exclude_unset=True)
    nullable_set = set(nullable_fields)
    for k, v in provided.items():
        if v is None and k not in nullable_set:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"`{k}` cannot be set to null when provided"
            )
        setattr(obj, k, v)

#Campus
@router.post("/campus", response_model=schemas.CampusRead, status_code=status.HTTP_201_CREATED)
def create_campus(payload: schemas.CampusCreate, db: Session = Depends(get_db)):
    new_campus = models.Campus(**payload.model_dump())
    db.add(new_campus)
    _commit_or_rollback(db)
    db.refresh(new_campus)
    return new_campus

@router.get("/campus", response_model=List[schemas.CampusRead])
def list_campus(db: Session = Depends(get_db)):
    return db.query(models.Campus).all()

@router.get("/campus/{campus_id}", response_model=schemas.CampusRead)
def get_campus(campus_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Campus, campus_id, "Campus")

@router.patch("/campus/{campus_id}", response_model=schemas.CampusRead)
def update_campus(campus_id: int, payload: schemas.CampusUpdate, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Campus, campus_id, "Campus")
    _apply_patch_or_reject_nulls(obj, payload, nullable_fields=["campus_name"])
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj

@router.delete("/campus/{campus_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campus(campus_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Campus, campus_id, "Campus")
    db.delete(obj)
    _commit_or_rollback(db)
    return None

#Buildings
@router.post("/buildings", response_model=schemas.BuildingRead, status_code=status.HTTP_201_CREATED)
def create_building(payload: schemas.BuildingCreate, db: Session = Depends(get_db)):
    new_building = models.Buildings(**payload.model_dump())
    db.add(new_building)
    _commit_or_rollback(db)
    db.refresh(new_building)
    return new_building

@router.get("/buildings", response_model=List[schemas.BuildingRead])
def list_buildings(db: Session = Depends(get_db)):
    return db.query(models.Buildings).all()

@router.get("/buildings/{building_id}", response_model=schemas.BuildingRead)
def get_building(building_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Buildings, building_id, "Building")

@router.patch("/buildings/{building_id}", response_model=schemas.BuildingRead)
def update_building(building_id: int, payload: schemas.BuildingUpdate, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Buildings, building_id, "Building")
    _apply_patch_or_reject_nulls(obj, payload, nullable_fields=["building_name"])
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj

@router.delete("/buildings/{building_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_building(building_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Buildings, building_id, "Building")
    db.delete(obj)
    _commit_or_rollback(db)
    return None

#Rooms
@router.post("/rooms", response_model=schemas.RoomRead, status_code=status.HTTP_201_CREATED)
def create_room(payload: schemas.RoomCreate, db: Session = Depends(get_db)):
    new_room = models.Rooms(**payload.model_dump())
    db.add(new_room)
    _commit_or_rollback(db)
    db.refresh(new_room)
    return new_room

@router.get("/rooms", response_model=List[schemas.RoomRead])
def list_rooms(db: Session = Depends(get_db)):
    return db.query(models.Rooms).all()

@router.get("/rooms/{room_id}", response_model=schemas.RoomRead)
def get_room(room_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Rooms, room_id, "Room")

@router.patch("/rooms/{room_id}", response_model=schemas.RoomRead)
def update_room(room_id: int, payload: schemas.RoomUpdate, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Rooms, room_id, "Room")
    _apply_patch_or_reject_nulls(obj, payload, nullable_fields=["unit_id"])
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj

@router.delete("/rooms/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(room_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Rooms, room_id, "Room")
    db.delete(obj)
    _commit_or_rollback(db)
    return None

#Faculty
@router.post("/faculty", response_model=schemas.FacultyRead, status_code=status.HTTP_201_CREATED)
def create_faculty(payload: schemas.FacultyCreate, db: Session = Depends(get_db)):
    new_faculty = models.Faculty(**payload.model_dump())
    db.add(new_faculty)
    _commit_or_rollback(db)
    db.refresh(new_faculty)
    return new_faculty

@router.get("/faculty", response_model=List[schemas.FacultyRead])
def list_faculty(db: Session = Depends(get_db)):
    return db.query(models.Faculty).all()

@router.get("/faculty/{faculty_id}", response_model=schemas.FacultyRead)
def get_faculty(faculty_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Faculty, faculty_id, "Faculty")

@router.patch("/faculty/{faculty_id}", response_model=schemas.FacultyRead)
def update_faculty(faculty_id: int, payload: schemas.FacultyUpdate, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Faculty, faculty_id, "Faculty")
    _apply_patch_or_reject_nulls(obj, payload)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj

@router.delete("/faculty/{faculty_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_faculty(faculty_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Faculty, faculty_id, "Faculty")
    db.delete(obj)
    _commit_or_rollback(db)
    return None