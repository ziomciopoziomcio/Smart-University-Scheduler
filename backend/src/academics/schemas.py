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