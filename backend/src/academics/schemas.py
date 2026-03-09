"""
Data validation schemas
"""

from typing import Optional, Annotated
from pydantic import BaseModel, model_validator, Field, StringConstraints, ConfigDict, field_validator


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class StudentBase(BaseSchema):
    user_id: int
    study_field: int
    major: Optional[int] = None

class StudentCreate(StudentBase):
    pass

class StudentRead(StudentBase):
    id: int

class StudentUpdate(BaseModel):
    study_field: Optional[int] = None
    major: Optional[int] = None

    @model_validator(mode='after')
    def check_study_field_not_none(self):
        provided = getattr(self, '__pydantic_fields_set__', set())
        if 'study_field' in provided and self.study_field is None:
            raise ValueError('`study_field` cannot be set to null when provided')
        return self

class EmployeesBase(BaseSchema):
    user_id: int
    faculty_id: int
    unit_id: int
    workload: Annotated[float, Field(ge=0)] = 80.0

class EmployeeCreate(EmployeesBase):
    pass

class EmployeeRead(EmployeesBase):
    id: int

class EmployeeUpdate(BaseModel):
    faculty_id: Optional[int] = None
    unit_id: Optional[int] = None
    workload: Optional[Annotated[float, Field(ge=0)]] = None

    @field_validator('workload', mode='before')
    def _reject_null_workload(cls, v):
        if v is None:
            raise ValueError('`workload` cannot be null when provided')
        return v

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

    @model_validator(mode='after')
    def _reject_explicit_nulls(self):
        provided = getattr(self, '__pydantic_fields_set__', set())
        if 'unit_name' in provided and self.unit_name is None:
            raise ValueError('`unit_name` cannot be null when provided')
        if 'faculty_id' in provided and self.faculty_id is None:
            raise ValueError('`faculty_id` cannot be null when provided')
        if 'unit_short' in provided and self.unit_short is None:
            raise ValueError('`unit_short` cannot be null when provided')
        return self

class GroupsBase(BaseSchema):
    group_name: Annotated[str, StringConstraints(max_length=255)]
    study_field: int
    major: Optional[int] = None
    elective_block: Optional[int] = None

    @model_validator(mode='after')
    def check_major_or_elective(self):
        if self.major is not None and self.elective_block is not None:
            raise ValueError('`major` and `elective_block` cannot be set at the same time')
        return self

class GroupsCreate(GroupsBase):
    pass

class GroupsRead(GroupsBase):
    id: int

class GroupsUpdate(BaseModel):
    group_name: Optional[Annotated[str, StringConstraints(max_length=255)]] = None
    study_field: Optional[int] = None
    major: Optional[int] = None

    @field_validator('group_name', mode='before')
    def _reject_null_group_name(cls, v):
        if v is None:
            raise ValueError('`group_name` cannot be null when provided')
        return v

    @field_validator('study_field', mode='before')
    def _reject_null_study_field(cls, v):
        if v is None:
            raise ValueError('`study_field` cannot be null when provided')
        return v

    @model_validator(mode='after')
    def check_major_or_elective(self):
        if self.major is not None and self.elective_block is not None:
            raise ValueError('`major` and `elective_block` cannot be set at the same time')
        return self
    elective_block: Optional[int] = None

    @model_validator(mode='after')
    def check_major_or_elective(self):
        if self.major is not None and self.elective_block is not None:
            raise ValueError('`major` and `elective_block` cannot be set at the same time')
        return self

class GroupMembersBase(BaseSchema):
    group: int
    student: int

class GroupMembersCreate(GroupMembersBase):
    pass

class GroupMembersRead(GroupMembersBase):
    id: int

class GroupMembersUpdate(BaseModel):
    group: Optional[int] = None
    student: Optional[int] = None

    @field_validator('group', mode='before')
    def _reject_null_group(cls, v):
        if v is None:
            raise ValueError('`group` cannot be null when provided')
        return v

    @field_validator('student', mode='before')
    def _reject_null_student(cls, v):
        if v is None:
            raise ValueError('`student` cannot be null when provided')
        return v