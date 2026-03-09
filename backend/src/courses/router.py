from typing import List, Any, Iterable
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from . import models, schemas
from ..database.database import get_db

router = APIRouter(prefix="/courses", tags=["courses"])


def _get_or_404(db: Session, model, obj_id: Any, name: str):
    obj = db.get(model, obj_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{name} not found")
    return obj


def _commit_or_rollback(db: Session):
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        detail = str(e.orig) if getattr(e, "orig", None) else str(e)
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


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

# Study Fields
@router.post("/study-fields", response_model=schemas.StudyFieldRead, status_code=status.HTTP_201_CREATED)
def create_study_field(payload: schemas.StudyFieldCreate, db: Session = Depends(get_db)):
    obj = models.Study_fields(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/study-fields", response_model=List[schemas.StudyFieldRead])
def list_study_fields(db: Session = Depends(get_db)):
    return db.query(models.Study_fields).all()


@router.get("/study-fields/{field_id}", response_model=schemas.StudyFieldRead)
def get_study_field(field_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Study_fields, field_id, "Study Field")



@router.patch("/study-fields/{field_id}", response_model=schemas.StudyFieldRead)
def update_study_field(field_id: int, payload: schemas.StudyFieldUpdate, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Study_fields, field_id, "Study Field")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/study-fields/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_field(field_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Study_fields, field_id, "Study Field")
    db.delete(obj)
    _commit_or_rollback(db)
    return None



# Major
@router.post("/majors", response_model=schemas.MajorRead, status_code=status.HTTP_201_CREATED)
def create_major(payload: schemas.MajorCreate, db: Session = Depends(get_db)):
    obj = models.Major(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/majors", response_model=List[schemas.MajorRead])
def list_majors(db: Session = Depends(get_db)):
    return db.query(models.Major).all()


@router.get("/majors/{major_id}", response_model=schemas.MajorRead)
def get_major(major_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Major, major_id, "Major")



@router.patch("/majors/{major_id}", response_model=schemas.MajorRead)
def update_major(major_id: int, payload: schemas.MajorUpdate, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Major, major_id, "Major")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/majors/{major_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_major(major_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Major, major_id, "Major")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Elective Blocks
@router.post("/elective-blocks", response_model=schemas.ElectiveBlockRead, status_code=status.HTTP_201_CREATED)
def create_elective_block(payload: schemas.ElectiveBlockCreate, db: Session = Depends(get_db)):
    obj = models.Elective_block(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/elective-blocks", response_model=List[schemas.ElectiveBlockRead])
def list_elective_blocks(db: Session = Depends(get_db)):
    return db.query(models.Elective_block).all()


@router.get("/elective-blocks/{block_id}", response_model=schemas.ElectiveBlockRead)
def get_elective_block(block_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Elective_block, block_id, "Elective Block")


@router.patch("/elective-blocks/{block_id}", response_model=schemas.ElectiveBlockRead)
def update_elective_block(block_id: int, payload: schemas.ElectiveBlockUpdate, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Elective_block, block_id, "Elective Block")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/elective-blocks/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_elective_block(block_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Elective_block, block_id, "Elective Block")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Course Type Details
@router.post("/types", response_model=schemas.CourseTypeDetailsRead, status_code=status.HTTP_201_CREATED)
def create_course_type(payload: schemas.CourseTypeDetailsCreate, db: Session = Depends(get_db)):
    obj = models.Course_type_details(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/types", response_model=List[schemas.CourseTypeDetailsRead])
def list_course_types(db: Session = Depends(get_db)):
    return db.query(models.Course_type_details).all()


@router.get("/types/{type_id}", response_model=schemas.CourseTypeDetailsRead)
def get_course_type(type_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Course_type_details, type_id, "Course Type")


@router.patch("/types/{type_id}", response_model=schemas.CourseTypeDetailsRead)
def update_course_type(type_id: int, payload: schemas.CourseTypeDetailsUpdate, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Course_type_details, type_id, "Course Type")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/types/{type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course_type(type_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Course_type_details, type_id, "Course Type")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Courses Instructors
@router.post("/instructors", response_model=schemas.CourseInstructorRead, status_code=status.HTTP_201_CREATED)
def create_course_instructor(payload: schemas.CourseInstructorCreate, db: Session = Depends(get_db)):
    obj = models.Courses_instructors(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/instructors", response_model=List[schemas.CourseInstructorRead])
def list_course_instructors(db: Session = Depends(get_db)):
    return db.query(models.Courses_instructors).all()


@router.get("/instructors/{instructor_id}", response_model=schemas.CourseInstructorRead)
def get_course_instructor(instructor_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Courses_instructors, instructor_id, "Course Instructor")


@router.patch("/instructors/{instructor_id}", response_model=schemas.CourseInstructorRead)
def update_course_instructor(instructor_id: int, payload: schemas.CourseInstructorUpdate, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Courses_instructors, instructor_id, "Course Instructor")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/instructors/{instructor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course_instructor(instructor_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Courses_instructors, instructor_id, "Course Instructor")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Courses
@router.post("/", response_model=schemas.CourseRead, status_code=status.HTTP_201_CREATED)
def create_course(payload: schemas.CourseCreate, db: Session = Depends(get_db)):
    obj = models.Courses(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/", response_model=List[schemas.CourseRead])
def list_courses(db: Session = Depends(get_db)):
    return db.query(models.Courses).all()


@router.get("/{course_id}", response_model=schemas.CourseRead)
def get_course(course_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Courses, course_id, "Course")


@router.patch("/{course_id}", response_model=schemas.CourseRead)
def update_course(course_id: int, payload: schemas.CourseUpdate, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Courses, course_id, "Course")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(course_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Courses, course_id, "Course")
    db.delete(obj)
    _commit_or_rollback(db)
    return None
