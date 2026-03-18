"""
Data validation schemas
"""

from typing import Optional, Annotated
from pydantic import BaseModel, model_validator, StringConstraints, ConfigDict


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
