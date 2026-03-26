from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from . import models, schemas
from ..database.database import get_db
from src.common.router_utils import (
    _get_or_404,
    _commit_or_rollback,
    _apply_patch_or_reject_nulls,
    _get_by_fields_or_404,
)
from src.common.pagination.pagination import paginate
from src.common.pagination.pagination_model import PaginatedResponse

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
    payload: schemas.StudyFieldCreate, db: Session = Depends(get_db)
):
    obj = models.Study_fields(**payload.model_dump())
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.get("/study-fields", response_model=PaginatedResponse[schemas.StudyFieldRead])
def list_study_fields(
    faculty: int | None = Query(None),
    field_name: str | None = Query(None, min_length=1),
    limit: int = Query(STUDY_FIELD_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(models.Study_fields)

    if faculty is not None:
        query = query.filter(models.Study_fields.faculty == faculty)
    if field_name is not None:
        query = query.filter(models.Study_fields.field_name.ilike(f"%{field_name}%"))

    return paginate(query, limit, offset, models.Study_fields.id)


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


@router.get("/majors", response_model=PaginatedResponse[schemas.MajorRead])
def list_majors(
    study_field: int | None = Query(None),
    major_name: str | None = Query(None, min_length=1),
    limit: int | None = Query(MAJOR_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(models.Major)

    if study_field is not None:
        query = query.filter(models.Major.study_field == study_field)
    if major_name is not None:
        query = query.filter(models.Major.major_name.ilike(f"%{major_name}%"))

    return paginate(query, limit, offset, models.Major.id)


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


@router.get(
    "/elective-blocks",
    response_model=PaginatedResponse[schemas.ElectiveBlockRead],
)
def list_elective_blocks(
    study_field: int | None = Query(None),
    elective_block_name: str | None = Query(None, min_length=1),
    limit: int | None = Query(ELECTIVE_BLOCK_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(models.Elective_block)

    if study_field is not None:
        query = query.filter(models.Elective_block.study_field == study_field)
    if elective_block_name is not None:
        query = query.filter(
            models.Elective_block.elective_block_name.ilike(f"%{elective_block_name}%")
        )

    return paginate(query, limit, offset, models.Elective_block.id)


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
    course: int, class_type: schemas.ClassType, db: Session = Depends(get_db)
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
):
    obj = _get_by_fields_or_404(
        db,
        models.Course_type_detail,
        "Course Type",
        course=course,
        class_type=class_type,
    )
    _apply_patch_or_reject_nulls(obj, payload)
    db.add(obj)
    _commit_or_rollback(db)
    db.refresh(obj)
    return obj


@router.delete("/types/{course}/{class_type}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course_type(
    course: int, class_type: schemas.ClassType, db: Session = Depends(get_db)
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
    payload: schemas.CourseInstructorCreate, db: Session = Depends(get_db)
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
):
    query = db.query(models.Course)

    if course_name is not None:
        query = query.filter(models.Course.course_name.ilike(f"%{course_name}%"))
    if course_language is not None:
        query = query.filter(models.Course.course_language == course_language)
    if leading_unit is not None:
        query = query.filter(models.Course.leading_unit == leading_unit)
    if course_coordinator is not None:
        query = query.filter(models.Course.course_coordinator == course_coordinator)
    if min_ects_points is not None:
        query = query.filter(models.Course.ects_points >= min_ects_points)
    if max_ects_points is not None:
        query = query.filter(models.Course.ects_points <= max_ects_points)

    return paginate(query, limit, offset, models.Course.course_code)


@router.get("/{course_code}", response_model=schemas.CourseRead)
def get_course(course_code: int, db: Session = Depends(get_db)):
    return _get_or_404(db, models.Course, course_code, "Course")


@router.patch("/{course_code}", response_model=schemas.CourseRead)
def update_course(
    course_code: int, payload: schemas.CourseUpdate, db: Session = Depends(get_db)
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
def delete_course(course_code: int, db: Session = Depends(get_db)):
    obj = _get_or_404(db, models.Course, course_code, "Course")
    db.delete(obj)
    _commit_or_rollback(db)
    return None


# Study Programs
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


@router.get(
    "/study-programs",
    response_model=PaginatedResponse[schemas.StudyProgramRead],
)
def list_study_programs(
    study_field: int | None = Query(None),
    start_year: str | None = Query(None, min_length=1),
    program_name: str | None = Query(None, min_length=1),
    limit: int | None = Query(STUDY_PROGRAM_LIMIT, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(models.Study_program)

    if study_field is not None:
        query = query.filter(models.Study_program.study_field == study_field)
    if start_year is not None:
        query = query.filter(models.Study_program.start_year.ilike(f"%{start_year}%"))
    if program_name is not None:
        query = query.filter(
            models.Study_program.program_name.ilike(f"%{program_name}%")
        )

    return paginate(query, limit, offset, models.Study_program.id)


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


@router.get(
    "/curriculum", response_model=PaginatedResponse[schemas.CurriculumCourseRead]
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
):
    query = db.query(models.Curriculum_course)

    if study_program is not None:
        query = query.filter(models.Curriculum_course.study_program == study_program)
    if course is not None:
        query = query.filter(models.Curriculum_course.course == course)
    if semester is not None:
        query = query.filter(models.Curriculum_course.semester == semester)
    if major is not None:
        query = query.filter(models.Curriculum_course.major == major)
    if elective_block is not None:
        query = query.filter(models.Curriculum_course.elective_block == elective_block)

    query = query.order_by(
        models.Curriculum_course.study_program,
        models.Curriculum_course.course,
        models.Curriculum_course.semester,
    )

    return paginate(
        query,
        limit,
        offset,
        order_by=[
            models.Curriculum_course.study_program,
            models.Curriculum_course.course,
            models.Curriculum_course.semester,
        ],
    )


@router.get(
    "/curriculum/{study_program}/{course}/{semester}",
    response_model=schemas.CurriculumCourseRead,
)
def get_curriculum_course(
    study_program: int, course: int, semester: int, db: Session = Depends(get_db)
):
    return _get_by_fields_or_404(
        db,
        models.Curriculum_course,
        "Curriculum Course",
        study_program=study_program,
        course=course,
        semester=semester,
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
    study_program: int, course: int, semester: int, db: Session = Depends(get_db)
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
