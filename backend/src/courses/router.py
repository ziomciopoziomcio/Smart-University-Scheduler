from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from . import models, schemas
from ..database.database import get_db
from src.common.router_utils import (
    _get_or_404,
    _commit_or_rollback,
    _apply_patch_or_reject_nulls,
)

router = APIRouter(prefix="/course", tags=["course"])


# Study Fields
@router.post(
    "/study-fields",
    response_model=schemas.StudyFieldRead,
    status_code=status.HTTP_201_CREATED,
)
def create_study_field(
    payload: schemas.StudyFieldCreate, db: Session = Depends(get_db)
):
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
def update_study_field(
    field_id: int, payload: schemas.StudyFieldUpdate, db: Session = Depends(get_db)
):
    obj = _get_or_404(db, models.Study_fields, field_id, "Study Field")
    _apply_patch_or_reject_nulls(obj, payload)
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
@router.post(
    "/majors", response_model=schemas.MajorRead, status_code=status.HTTP_201_CREATED
)
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
def update_major(
    major_id: int, payload: schemas.MajorUpdate, db: Session = Depends(get_db)
):
    obj = _get_or_404(db, models.Major, major_id, "Major")
    _apply_patch_or_reject_nulls(obj, payload, nullable_fields={"study_field"})
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
@router.post(
    "/elective-blocks",
    response_model=schemas.ElectiveBlockRead,
    status_code=status.HTTP_201_CREATED,
)
def create_elective_block(
    payload: schemas.ElectiveBlockCreate, db: Session = Depends(get_db)
):
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
def update_elective_block(
    block_id: int, payload: schemas.ElectiveBlockUpdate, db: Session = Depends(get_db)
):
    obj = _get_or_404(db, models.Elective_block, block_id, "Elective Block")
    _apply_patch_or_reject_nulls(obj, payload)
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


# Course Type Detail
@router.post(
    "/types",
    response_model=schemas.CourseTypeDetailRead,
    status_code=status.HTTP_201_CREATED,
)
def create_course_type(
    payload: schemas.CourseTypeDetailCreate, db: Session = Depends(get_db)
):
    obj = models.Course_type_detail(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/types", response_model=List[schemas.CourseTypeDetailRead])
def list_course_types(db: Session = Depends(get_db)):
    return db.query(models.Course_type_detail).all()


@router.get("/types/{type_id}", response_model=schemas.CourseTypeDetailRead)
def get_course_type(type_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Course_type_detail, type_id, "Course Type")


@router.patch("/types/{type_id}", response_model=schemas.CourseTypeDetailRead)
def update_course_type(
    type_id: int,
    payload: schemas.CourseTypeDetailUpdate,
    db: Session = Depends(get_db),
):
    obj = _get_or_404(db, models.Course_type_detail, type_id, "Course Type")
    _apply_patch_or_reject_nulls(obj, payload)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/types/{type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course_type(type_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Course_type_detail, type_id, "Course Type")
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
    payload: schemas.CourseInstructorCreate, db: Session = Depends(get_db)
):
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
    return _get_or_404(
        db, models.Courses_instructors, instructor_id, "Course Instructor"
    )


@router.patch(
    "/instructors/{instructor_id}", response_model=schemas.CourseInstructorRead
)
def update_course_instructor(
    instructor_id: int,
    payload: schemas.CourseInstructorUpdate,
    db: Session = Depends(get_db),
):
    obj = _get_or_404(
        db, models.Courses_instructors, instructor_id, "Course Instructor"
    )
    _apply_patch_or_reject_nulls(obj, payload)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/instructors/{instructor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course_instructor(instructor_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(
        db, models.Courses_instructors, instructor_id, "Course Instructor"
    )
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Course
@router.post(
    "/", response_model=schemas.CourseRead, status_code=status.HTTP_201_CREATED
)
def create_course(payload: schemas.CourseCreate, db: Session = Depends(get_db)):
    obj = models.Course(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/", response_model=List[schemas.CourseRead])
def list_courses(db: Session = Depends(get_db)):
    return db.query(models.Course).all()


@router.get("/{course_code}", response_model=schemas.CourseRead)
def get_course(course_code: str, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Course, course_code, "Course")


@router.patch("/{course_code}", response_model=schemas.CourseRead)
def update_course(
    course_code: str, payload: schemas.CourseUpdate, db: Session = Depends(get_db)
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
def delete_course(course_code: str, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Course, course_code, "Course")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


@router.post(
    "/study-programs",
    response_model=schemas.StudyProgramRead,
    status_code=status.HTTP_201_CREATED,
)
def create_study_program(
    payload: schemas.StudyProgramCreate, db: Session = Depends(get_db)
):
    obj = models.Study_program(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/study-programs", response_model=List[schemas.StudyProgramRead])
def list_study_programs(db: Session = Depends(get_db)):
    return db.query(models.Study_program).all()


@router.get("/study-programs/{program_id}", response_model=schemas.StudyProgramRead)
def get_study_program(program_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Study_program, program_id, "StudyProgram")


@router.patch("/study-programs/{program_id}", response_model=schemas.StudyProgramRead)
def update_study_program(
    program_id: int, payload: schemas.StudyProgramUpdate, db: Session = Depends(get_db)
):
    obj = _get_or_404(db, models.Study_program, program_id, "Study Program")
    _apply_patch_or_reject_nulls(obj, payload, nullable_fields={"program_name"})
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/study-programs/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_program(program_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Study_program, program_id, "Study Program")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


@router.post(
    "/curriculum",
    response_model=schemas.CurriculumCourseRead,
    status_code=status.HTTP_201_CREATED,
)
def create_curriculum_course(
    payload: schemas.CurriculumCourseCreate,
    db: Session = Depends(get_db),
):
    obj = models.Curriculum_course(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/curriculum", response_model=List[schemas.CurriculumCourseRead])
def list_curriculum(db: Session = Depends(get_db)):
    return db.query(models.Curriculum_course).all()


@router.get("/curriculum/{curriculum_id}", response_model=schemas.CurriculumCourseRead)
def get_curriculum_course(curriculum_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Curriculum_course, curriculum_id, "Curriculum Course")


@router.patch(
    "/curriculum/{curriculum_id}", response_model=schemas.CurriculumCourseRead
)
def update_curriculum_course(
    curriculum_id: int,
    payload: schemas.CurriculumCourseUpdate,
    db: Session = Depends(get_db),
):
    obj = _get_or_404(db, models.Curriculum_course, curriculum_id, "Curriculum Course")
    _apply_patch_or_reject_nulls(
        obj, payload, nullable_fields={"major", "elective_block"}
    )
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/curriculum/{curriculum_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_curriculum(curriculum_id: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Curriculum_course, curriculum_id, "Curriculum Course")
    db.delete(obj)
    _commit_or_rollback(db)
    return None
