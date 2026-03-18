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


# Course
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


# Course Type Detail
class CourseTypeDetailBase(BaseSchema):
    course: int
    class_type: ClassType
    class_hours: Annotated[int, Field(ge=0)] = 0
    pc_needed: bool = False
    projector_needed: bool = True
    max_group_participants_number: Annotated[int, Field(gt=0)] = 15


class CourseTypeDetailCreate(CourseTypeDetailBase):
    pass


class CourseTypeDetailRead(CourseTypeDetailBase):
    pass


class CourseTypeDetailUpdate(BaseModel):
    class_hours: Optional[Annotated[int, Field(ge=0)]] = None
    pc_needed: Optional[bool] = None
    projector_needed: Optional[bool] = None
    max_group_participants_number: Optional[Annotated[int, Field(gt=0)]] = None


# Courses Instructors
class CourseInstructorBase(BaseSchema):
    employee: int
    course: int
    class_type: ClassType
    hours: Annotated[int, Field(ge=0)]


class CourseInstructorCreate(CourseInstructorBase):
    pass


class CourseInstructorRead(CourseInstructorBase):
    pass


class CourseInstructorUpdate(BaseModel):
    hours: Optional[Annotated[int, Field(ge=0)]] = 0


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


# Curriculum Courses
class CurriculumCourseBase(BaseSchema):
    study_program: int
    course: int
    semester: Annotated[int, Field(gt=0)]
    major: Optional[int] = None
    elective_block: Optional[int] = None

    @model_validator(mode="after")
    def check_major_and_elective(self):
        if self.major is not None and self.elective_block is not None:
            raise ValueError(
                "Course cannot belong to both a major and an elective block"
            )
        return self


class CurriculumCourseCreate(CurriculumCourseBase):
    pass


class CurriculumCourseRead(CurriculumCourseBase):
    pass


class CurriculumCourseUpdate(BaseModel):
    major: Optional[int] = None
    elective_block: Optional[int] = None

    @model_validator(mode="after")
    def check_major_and_elective(self):
        if self.major is not None and self.elective_block is not None:
            raise ValueError(
                "Course cannot belong to both a major and an elective block"
            )
        return self
