"""
Data validation schemas
"""

from __future__ import annotations

from typing import Annotated

from pydantic import BaseModel, model_validator, Field, StringConstraints, ConfigDict

from .models import CourseLanguage, ClassType, FrequencyType, StudyMode, StudyDegree


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# Study Fields
class StudyFieldBase(BaseSchema):
    faculty: int
    field_name: Annotated[str, StringConstraints(max_length=255)]
    language: CourseLanguage = CourseLanguage.POLISH
    mode: StudyMode = StudyMode.FULL_TIME
    degree: StudyDegree = StudyDegree.BACHELOR


class StudyFieldCreate(StudyFieldBase):
    pass


class StudyFieldRead(StudyFieldBase):
    id: int


class StudyFieldUpdate(BaseModel):
    faculty: int | None = None
    field_name: Annotated[str, StringConstraints(max_length=255)] | None = None
    language: CourseLanguage | None = None
    mode: StudyMode | None = None
    degree: StudyDegree | None = None


class StudyFieldListSummary(StudyFieldRead):
    semesters_count: int
    specializations_count: int
    elective_blocks_count: int
    programs_count: int


# Major
class MajorBase(BaseSchema):
    study_field: int | None = None
    major_name: Annotated[str, StringConstraints(max_length=255)]


class MajorCreate(MajorBase):
    pass


class MajorRead(MajorBase):
    id: int
    group_count: int = 0


class MajorUpdate(BaseModel):
    study_field: int | None = None
    major_name: Annotated[str, StringConstraints(max_length=255)] | None = None


# Elective Block
class ElectiveBlockBase(BaseSchema):
    study_field: int
    elective_block_name: Annotated[str, StringConstraints(max_length=255)]


class ElectiveBlockCreate(ElectiveBlockBase):
    pass


class ElectiveBlockRead(ElectiveBlockBase):
    id: int


class ElectiveBlockUpdate(BaseModel):
    study_field: int | None = None
    elective_block_name: Annotated[str, StringConstraints(max_length=255)] | None = None


# Course
class CourseBase(BaseSchema):
    course_code: int
    ects_points: Annotated[int, Field(ge=0)]
    course_name: Annotated[str, StringConstraints(max_length=255)]
    course_language: CourseLanguage
    leading_unit: int
    course_coordinator: int


class CourseCreate(CourseBase):
    pass


class CourseRead(CourseBase):
    pass


class CourseUpdate(BaseModel):
    # Editing course_code is unsafe
    ects_points: Annotated[int, Field(ge=0)] | None = None
    course_name: Annotated[str, StringConstraints(max_length=255)] | None = None
    course_language: CourseLanguage | None = None
    leading_unit: int | None = None
    course_coordinator: int | None = None


# Course Type Detail
class CourseTypeDetailBase(BaseSchema):
    course: int
    class_type: ClassType
    class_hours: Annotated[int, Field(ge=0)] = 0
    slots_per_class: Annotated[int, Field(ge=1, le=10)] = 2
    frequency: FrequencyType = FrequencyType.EVERY_WEEK
    manual_weeks: list[int] | None = None
    pc_needed: bool = False
    projector_needed: bool = True
    max_group_participants_number: Annotated[int, Field(gt=0)] = 15


class CourseTypeDetailCreate(CourseTypeDetailBase):
    pass


class CourseTypeDetailRead(CourseTypeDetailBase):
    pass


class CourseTypeDetailUpdate(BaseModel):
    class_hours: Annotated[int, Field(ge=0)] | None = None
    slots_per_class: Annotated[int, Field(ge=1, le=10)] | None = None
    frequency: FrequencyType | None = None
    manual_weeks: FrequencyType | None = None
    pc_needed: bool | None = None
    projector_needed: bool | None = None
    max_group_participants_number: Annotated[int, Field(gt=0)] | None = None


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
    hours: Annotated[int, Field(ge=0)] | None = None


# Study Programs
class StudyProgramBase(BaseSchema):
    study_field: int
    start_year: Annotated[str, StringConstraints(max_length=20)]
    program_name: Annotated[str, StringConstraints(max_length=255)] | None = None


class StudyProgramCreate(StudyProgramBase):
    pass


class StudyProgramRead(StudyProgramBase):
    id: int


class StudyProgramDetailRead(StudyProgramRead):
    semesters_count: int
    semester_summary: list["SemesterSummary"] = Field(default_factory=list)


class StudyProgramUpdate(StudyProgramBase):
    study_field: int | None = None
    start_year: Annotated[str, StringConstraints(max_length=20)] | None = None
    program_name: Annotated[str, StringConstraints(max_length=255)] | None = None


# Curriculum Courses
class CurriculumCourseBase(BaseSchema):
    study_program: int
    course: int
    semester: Annotated[int, Field(gt=0)]
    major: int | None = None
    elective_block: int | None = None

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
    major: int | None = None
    elective_block: int | None = None

    @model_validator(mode="after")
    def check_major_and_elective(self):
        if self.major is not None and self.elective_block is not None:
            raise ValueError(
                "Course cannot belong to both a major and an elective block"
            )
        return self


class CourseSummary(BaseSchema):
    course_code: int
    course_name: str
    ects_points: int


class CurriculumCourseNested(CurriculumCourseRead):
    course_details: CourseSummary
    major_details: MajorRead | None = None
    elective_block_details: ElectiveBlockRead | None = None


class SemesterSummary(BaseSchema):
    semester_number: int
    courses_count: int
    ects_sum: int
