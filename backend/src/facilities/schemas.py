"""
Data validation schemas
"""

from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints, ConfigDict


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class CampusBase(BaseSchema):
    campus_short: Annotated[str, StringConstraints(max_length=255)]
    campus_name: Annotated[str, StringConstraints(max_length=255)] | None = None


class CampusCreate(CampusBase):
    pass


class CampusRead(CampusBase):
    id: int


class CampusUpdate(BaseModel):
    campus_name: Annotated[str, StringConstraints(max_length=255)] | None = None
    campus_short: Annotated[str, StringConstraints(max_length=255)] | None = None


# Buildings
class BuildingBase(BaseSchema):
    building_number: Annotated[str, StringConstraints(max_length=255)]
    campus_id: int
    building_name: Annotated[str, StringConstraints(max_length=255)] | None = None


class BuildingCreate(BuildingBase):
    pass


class BuildingRead(BuildingBase):
    id: int
    rooms_number: int = 0


class BuildingUpdate(BaseModel):
    building_name: Annotated[str, StringConstraints(max_length=255)] | None = None
    building_number: Annotated[str, StringConstraints(max_length=255)] | None = None
    campus_id: int | None = None


# Rooms
class RoomBase(BaseSchema):
    room_name: Annotated[str, StringConstraints(max_length=255)]
    building_id: int
    faculty_id: int
    pc_amount: Annotated[int, Field(ge=0)] = 0
    room_capacity: Annotated[int, Field(gt=0)] = 15
    unit_id: int | None = None
    projector_availability: bool = False


class RoomCreate(RoomBase):
    pass


class RoomRead(RoomBase):
    id: int


class RoomUpdate(BaseModel):
    room_name: Annotated[str, StringConstraints(max_length=255)] | None = None
    projector_availability: bool | None = None
    pc_amount: Annotated[int, Field(ge=0)] | None = None
    room_capacity: Annotated[int, Field(gt=0)] | None = None
    building_id: int | None = None
    unit_id: int | None = None
    faculty_id: int | None = None


# Faculty
class FacultyBase(BaseSchema):
    faculty_name: Annotated[str, StringConstraints(max_length=255)]
    faculty_short: Annotated[str, StringConstraints(max_length=255)]


class FacultyCreate(FacultyBase):
    pass


class FacultyRead(FacultyBase):
    id: int


class FacultyReadWithCounter(FacultyRead):
    lecturers_count: Annotated[int, Field(ge=0)] = 0
    students_count: Annotated[int, Field(ge=0)] = 0


class FacultyUpdate(BaseModel):
    faculty_name: Annotated[str, StringConstraints(max_length=255)] | None = None
    faculty_short: Annotated[str, StringConstraints(max_length=255)] | None = None
