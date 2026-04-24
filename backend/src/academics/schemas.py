"""
Data validation schemas
"""

from datetime import date
from typing import Optional, Annotated

from pydantic import BaseModel, model_validator, StringConstraints, ConfigDict, Field

from src.courses import schemas as courses_schemas
from src.facilities import schemas as facilities_schemas
from src.users import schemas as user_schemas
from .models import SemesterType


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class StudentBase(BaseSchema):
    user_id: int
    study_program: int
    major: Optional[int] = None


class StudentCreate(StudentBase):
    pass


class StudentRead(StudentBase):
    id: int


class StudentUpdate(BaseModel):
    study_program: Optional[int] = None
    major: Optional[int] = None


class EmployeesBase(BaseSchema):
    user_id: int
    faculty_id: int
    unit_id: int


class EmployeeCreate(EmployeesBase):
    pass


class EmployeeRead(EmployeesBase):
    id: int


class EmployeeUpdate(BaseModel):
    faculty_id: Optional[int] = None
    unit_id: Optional[int] = None


class UnitsBase(BaseSchema):
    unit_name: Annotated[str, StringConstraints(max_length=255)]
    faculty_id: int
    unit_short: Annotated[str, StringConstraints(max_length=255)]


class UnitsCreate(UnitsBase):
    pass


class UnitsRead(UnitsBase):
    id: int


class UnitsUpdate(BaseModel):
    unit_name: Optional[Annotated[str, StringConstraints(max_length=255)]] = None
    faculty_id: Optional[int] = None
    unit_short: Optional[Annotated[str, StringConstraints(max_length=255)]] = None


class GroupsBase(BaseSchema):
    group_name: Annotated[str, StringConstraints(max_length=255)]
    study_program: int
    major: Optional[int] = None
    elective_block: Optional[int] = None

    @model_validator(mode="after")
    def check_major_or_elective(self):
        if self.major is not None and self.elective_block is not None:
            raise ValueError(
                "`major` and `elective_block` cannot be set at the same time"
            )
        return self


class GroupsCreate(GroupsBase):
    pass


class GroupsRead(GroupsBase):
    id: int


class GroupsUpdate(BaseModel):
    group_name: Optional[Annotated[str, StringConstraints(max_length=255)]] = None
    study_program: Optional[int] = None
    major: Optional[int] = None
    elective_block: Optional[int] = None

    @model_validator(mode="after")
    def check_major_or_elective(self):
        if self.major is not None and self.elective_block is not None:
            raise ValueError(
                "`major` and `elective_block` cannot be set at the same time"
            )
        return self


class GroupMembersBase(BaseSchema):
    group: int
    student: int


class GroupMembersCreate(GroupMembersBase):
    pass


class GroupMembersRead(GroupMembersBase):
    pass


class GroupMembersUpdate(BaseModel):
    group: Optional[int] = None
    student: Optional[int] = None


class AcademicCalendarBase(BaseSchema):
    calendar_date: date
    academic_year: str = Field(..., max_length=20, examples=["2025/2026"])
    semester_type: SemesterType
    week_number: int = Field(..., ge=1, le=20)  # TODO: Make it dynamic
    academic_day_of_week: int = Field(..., ge=1, le=7)
    description: Optional[str] = Field(None, max_length=255)


class AcademicCalendarCreate(AcademicCalendarBase):
    pass


class AcademicCalendarRead(AcademicCalendarBase):
    pass


class AcademicCalendarUpdate(BaseModel):
    academic_year: Optional[str] = Field(None, max_length=20, examples=["2025/2026"])
    semester_type: Optional[SemesterType] = None
    week_number: Optional[int] = Field(None, ge=1, le=20)
    academic_day_of_week: Optional[int] = Field(None, ge=1, le=7)
    description: Optional[str] = Field(None, max_length=255)


class StudentNested(BaseSchema):
    id: int
    user: user_schemas.UserRead
    study_program_details: courses_schemas.StudyProgramRead
    major_details: Optional[courses_schemas.MajorRead] = None
    study_program: int
    major: Optional[int] = None
    user_id: int


class EmployeeNested(BaseSchema):
    id: int
    user: user_schemas.UserRead
    unit: Optional[UnitsRead] = None
    faculty: Optional[facilities_schemas.FacultyRead] = None
    faculty_id: int
    user_id: int
    unit_id: int


class StudyFieldSemesterSummary(BaseSchema):
    semester_number: int
    groups_count: int
    specializations_count: int | None = None
    elective_blocks_count: int | None = None


class StudyPlanGroupSummary(BaseSchema):
    id: int
    group_name: str = Field(..., max_length=255)
    academic_year: str = Field(..., max_length=20, examples=["2025/2026"])


class CourseInstructor(BaseSchema):
    id: int
    name: str
    surname: str
    degree: str | None
