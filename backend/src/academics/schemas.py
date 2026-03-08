"""
Data validation schemas
"""
from typing import Optional
from pydantic import BaseModel, root_validator, constr, confloat

class BaseSchema(BaseModel):
    class Config:
        orm_mode = True

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
    workload: Optional[confloat(ge=0)] = 80.0

class EmployeeCreate(EmployeesBase):
    pass

class EmployeeRead(EmployeesBase):
    id: int

class EmployeeUpdate(BaseModel):
    faculty_id: Optional[int] = None
    unit_id: Optional[int] = None
    workload: Optional[confloat(ge=0)] = None

class UnitsBase(BaseSchema):
    unit_name: constr(max_length=255)
    faculty_id: int
    unit_short: constr(max_length=255)

class UnitsCreate(UnitsBase):
    pass

class UnitsRead(UnitsBase):
    id: int

class UnitsUpdate(UnitsBase):
    unit_name = Optional[constr(max_length=255)] = None
    faculty_id: Optional[int] = None
    unit_short: Optional[constr(max_length=255)] = None

class GroupsBase(BaseSchema):
    group_name: constr(max_length=255)
    study_field: int
    major: Optional[int] = None
    elective_block: Optional[bool] = False

    @root_validator
    def check_major_or_elective(cls, values):
        major, elective = values.get('major'), values.get('elective_block')
        if major is not None and elective is not None:
            raise ValueError('`major` i `elective_block` can`t be set at the same time')
        return values

class GroupsCreate(GroupsBase):
    pass

class GroupsRead(GroupsBase):
    id: int

class GroupsUpdate(GroupsBase):
    group_name = Optional[constr(max_length=255)] = None
    study_field: Optional[int] = None
    major: Optional[int] = None
    elective_block: Optional[bool] = None

    @root_validator
    def check_major_or_elective(cls, values):
        major, elective = values.get('major'), values.get('elective_block')
        if major is not None and elective is not None:
            raise ValueError('`major` i `elective_block` can`t be set at the same time')
        return values

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