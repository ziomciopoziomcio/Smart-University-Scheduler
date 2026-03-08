"""
Data validation schemas
"""
from typing import Optional
from pydantic import BaseModel, root_validator, constr, conint
from .models import CourseLanguage, ClassType


class BaseSchema(BaseModel):
    class Config:
        orm_mode = True


# Study Fields
class StudyFieldBase(BaseSchema):
    faculty: int
    field_name: constr(max_length=255)


class StudyFieldCreate(StudyFieldBase):
    pass


class StudyFieldRead(StudyFieldBase):
    id: int


class StudyFieldUpdate(BaseModel):
    faculty: Optional[int] = None
    field_name: Optional[constr(max_length=255)] = None


# Major
class MajorBase(BaseSchema):
    study_field: Optional[int] = None
    major_name: constr(max_length=255)


class MajorCreate(MajorBase):
    pass


class MajorRead(MajorBase):
    id: int


class MajorUpdate(BaseModel):
    study_field: Optional[int] = None
    major_name: Optional[constr(max_length=255)] = None


# Elective Block
class ElectiveBlockBase(BaseSchema):
    study_field: int
    elective_block_name: constr(max_length=255)


class ElectiveBlockCreate(ElectiveBlockBase):
    pass


class ElectiveBlockRead(ElectiveBlockBase):
    id: int


class ElectiveBlockUpdate(BaseModel):
    study_field: Optional[int] = None
    elective_block_name: Optional[constr(max_length=255)] = None



# Courses
class CourseBase(BaseSchema):
    ects_points: conint(ge=0)
    course_name: constr(max_length=255)
    course_language: CourseLanguage
    leading_unit: int
    course_coordinator: int
    study_field: int
    major: Optional[int] = None
    elective_block: Optional[int] = None

    @root_validator
    def check_major_or_elective(cls, values):
        major = values.get("major")
        elective = values.get("elective_block")

        if major is not None and elective is not None:
            raise ValueError("`major` and `elective_block` can't be set at the same time")

        return values


class CourseCreate(CourseBase):
    pass


class CourseRead(CourseBase):
    course_code: int


class CourseUpdate(BaseModel):
    ects_points: Optional[conint(ge=0)] = None
    course_name: Optional[constr(max_length=255)] = None
    course_language: Optional[CourseLanguage] = None
    leading_unit: Optional[int] = None
    course_coordinator: Optional[int] = None
    study_field: Optional[int] = None
    major: Optional[int] = None
    elective_block: Optional[int] = None

    @root_validator
    def check_major_or_elective(cls, values):
        major = values.get("major")
        elective = values.get("elective_block")

        if major is not None and elective is not None:
            raise ValueError("`major` and `elective_block` can't be set at the same time")

        return values


# Course Type Details
class CourseTypeDetailsBase(BaseSchema):
    course: int
    class_type: ClassType
    class_hours: conint(ge=0) = 0
    pc_needed: bool = False
    projector_needed: bool = True
    max_group_participants_number: conint(gt=0) = 15


class CourseTypeDetailsCreate(CourseTypeDetailsBase):
    pass


class CourseTypeDetailsRead(CourseTypeDetailsBase):
    id: int


class CourseTypeDetailsUpdate(BaseModel):
    course: Optional[int] = None
    class_type: Optional[ClassType] = None
    class_hours: Optional[conint(ge=0)] = None
    pc_needed: Optional[bool] = None
    projector_needed: Optional[bool] = None
    max_group_participants_number: Optional[conint(gt=0)] = None



# Courses Instructors
class CourseInstructorBase(BaseSchema):
    employee: int
    course_type_details: int
    min_hours: Optional[conint(ge=0)] = None
    max_hours: Optional[conint(ge=0)] = None
    priority: Optional[bool] = None


class CourseInstructorCreate(CourseInstructorBase):
    pass


class CourseInstructorRead(CourseInstructorBase):
    id: int


class CourseInstructorUpdate(BaseModel):
    employee: Optional[int] = None
    course_type_details: Optional[int] = None
    min_hours: Optional[conint(ge=0)] = None
    max_hours: Optional[conint(ge=0)] = None
    priority: Optional[bool] = None