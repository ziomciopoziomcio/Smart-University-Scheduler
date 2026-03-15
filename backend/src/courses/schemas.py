"""
Data validation schemas
"""

from typing import Optional, Annotated
from pydantic import BaseModel, model_validator, Field, StringConstraints, ConfigDict
from .models import CourseLanguage, ClassType


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# Study Fields
class StudyFieldBase(BaseSchema):
    faculty: int
    field_name: Annotated[str, StringConstraints(max_length=255)]


class StudyFieldCreate(StudyFieldBase):
    pass


class StudyFieldRead(StudyFieldBase):
    id: int


class StudyFieldUpdate(BaseModel):
    faculty: Optional[int] = None
    field_name: Optional[Annotated[str, StringConstraints(max_length=255)]] = None


# Major
class MajorBase(BaseSchema):
    study_field: Optional[int] = None
    major_name: Annotated[str, StringConstraints(max_length=255)]


class MajorCreate(MajorBase):
    pass


class MajorRead(MajorBase):
    id: int


class MajorUpdate(BaseModel):
    study_field: Optional[int] = None
    major_name: Optional[Annotated[str, StringConstraints(max_length=255)]] = None


# Elective Block
class ElectiveBlockBase(BaseSchema):
    study_field: int
    elective_block_name: Annotated[str, StringConstraints(max_length=255)]


class ElectiveBlockCreate(ElectiveBlockBase):
    pass


class ElectiveBlockRead(ElectiveBlockBase):
    id: int


class ElectiveBlockUpdate(BaseModel):
    study_field: Optional[int] = None
    elective_block_name: Optional[Annotated[str, StringConstraints(max_length=255)]] = (
        None
    )


# Courses
class CourseBase(BaseSchema):
    ects_points: Annotated[int, Field(ge=0)]
    course_name: Annotated[str, StringConstraints(max_length=255)]
    course_language: CourseLanguage
    leading_unit: int
    course_coordinator: int


class CourseCreate(CourseBase):
    pass


class CourseRead(CourseBase):
    course_code: int


class CourseUpdate(BaseModel):
    ects_points: Optional[Annotated[int, Field(ge=0)]] = None
    course_name: Optional[Annotated[str, StringConstraints(max_length=255)]] = None
    course_language: Optional[CourseLanguage] = None
    leading_unit: Optional[int] = None
    course_coordinator: Optional[int] = None


# Course Type Details
class CourseTypeDetailsBase(BaseSchema):
    course: int
    class_type: ClassType
    class_hours: Annotated[int, Field(ge=0)] = 0
    pc_needed: bool = False
    projector_needed: bool = True
    max_group_participants_number: Annotated[int, Field(gt=0)] = 15


class CourseTypeDetailsCreate(CourseTypeDetailsBase):
    pass


class CourseTypeDetailsRead(CourseTypeDetailsBase):
    id: int


class CourseTypeDetailsUpdate(BaseModel):
    course: Optional[int] = None
    class_type: Optional[ClassType] = None
    class_hours: Optional[Annotated[int, Field(ge=0)]] = None
    pc_needed: Optional[bool] = None
    projector_needed: Optional[bool] = None
    max_group_participants_number: Optional[Annotated[int, Field(gt=0)]] = None


# Courses Instructors
class CourseInstructorBase(BaseSchema):
    employee: int
    course_type_details: int
    min_hours: Optional[Annotated[int, Field(ge=0)]] = None
    max_hours: Optional[Annotated[int, Field(ge=0)]] = None
    priority: Optional[bool] = None


class CourseInstructorCreate(CourseInstructorBase):
    pass


class CourseInstructorRead(CourseInstructorBase):
    id: int


class CourseInstructorUpdate(BaseModel):
    employee: Optional[int] = None
    course_type_details: Optional[int] = None
    min_hours: Optional[Annotated[int, Field(ge=0)]] = None
    max_hours: Optional[Annotated[int, Field(ge=0)]] = None
    priority: Optional[bool] = None


# Study Programs
class StudyProgramBase(BaseSchema):
    study_field: int
    start_year: Annotated[str, StringConstraints(max_length=20)]
    program_name: Optional[Annotated[str, StringConstraints(max_length=255)]] = None


class StudyProgramCreate(StudyProgramBase):
    pass


class StudyProgramRead(StudyProgramBase):
    id: int


class StudyProgramUpdate(StudyProgramBase):
    study_field: Optional[int] = None
    start_year: Optional[Annotated[str, StringConstraints(max_length=20)]] = None
    program_name: Optional[Annotated[str, StringConstraints(max_length=255)]] = None


