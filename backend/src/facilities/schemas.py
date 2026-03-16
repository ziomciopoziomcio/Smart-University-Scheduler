"""
Data validation schemas
"""

from typing import Optional, Annotated
from pydantic import BaseModel, Field, StringConstraints, ConfigDict


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class CampusBase(BaseSchema):
    campus_short: Annotated[str, StringConstraints(max_length=255)]
    campus_name: Optional[Annotated[str, StringConstraints(max_length=255)]] = None


class CampusCreate(CampusBase):
    pass


class CampusRead(CampusBase):
    id: int


class CampusUpdate(BaseModel):
    campus_name: Optional[Annotated[str, StringConstraints(max_length=255)]] = None
    campus_short: Optional[Annotated[str, StringConstraints(max_length=255)]] = None


# Buildings
class BuildingBase(BaseSchema):
    building_number: Annotated[str, StringConstraints(max_length=255)]
    campus_id: int
    building_name: Optional[Annotated[str, StringConstraints(max_length=255)]] = None


class BuildingCreate(BuildingBase):
    pass


class BuildingRead(BuildingBase):
    id: int


class BuildingUpdate(BaseModel):
    building_name: Optional[Annotated[str, StringConstraints(max_length=255)]] = None
    building_number: Optional[Annotated[str, StringConstraints(max_length=255)]] = None
    campus_id: Optional[int] = None


# Rooms
class RoomBase(BaseSchema):
    room_name: Annotated[str, StringConstraints(max_length=255)]
    building_id: int
    faculty_id: int
    pc_amount: Annotated[int, Field(ge=0)] = 0
    room_capacity: Annotated[int, Field(gt=0)] = 15
    unit_id: Optional[int] = None
    projector_availability: bool = False


class RoomCreate(RoomBase):
    pass


class RoomRead(RoomBase):
    id: int


class RoomUpdate(BaseModel):
    room_name: Optional[Annotated[str, StringConstraints(max_length=255)]] = None
    projector_availability: Optional[bool] = None
    pc_amount: Optional[Annotated[int, Field(ge=0)]] = None
    room_capacity: Optional[Annotated[int, Field(gt=0)]] = None
    building_id: Optional[int] = None
    unit_id: Optional[int] = None
    faculty_id: int | None = None


# Faculty
class FacultyBase(BaseSchema):
    faculty_name: Annotated[str, StringConstraints(max_length=255)]
    faculty_short: Annotated[str, StringConstraints(max_length=255)]


class FacultyCreate(FacultyBase):
    pass


class FacultyRead(FacultyBase):
    id: int


class FacultyUpdate(BaseModel):
    faculty_name: Optional[Annotated[str, StringConstraints(max_length=255)]] = None
    faculty_short: Optional[Annotated[str, StringConstraints(max_length=255)]] = None
