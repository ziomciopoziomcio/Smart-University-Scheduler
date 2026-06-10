import re
import uuid
from datetime import datetime, date
from typing import Annotated, Dict, Any

from pydantic import (
    BaseModel,
    Field,
    ConfigDict,
    StringConstraints,
    model_validator,
    field_validator,
)
from enum import Enum
from .models import AbsenceStatus
from .models import SuggestionStatus
from .models import CustomEventType
from ..academics.models import SemesterType
from ..courses.models import ClassType


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class ScheduleSuggestionBase(BaseSchema):
    source: Annotated[str, StringConstraints(max_length=50)]
    reason: Annotated[str, StringConstraints(max_length=255)]
    target_class_session_id: uuid.UUID

    state_before: Dict[str, Any]
    state_after: Dict[str, Any]


class ScheduleSuggestionCreate(ScheduleSuggestionBase):
    pass


class ScheduleSuggestionRead(ScheduleSuggestionBase):
    id: int
    status: SuggestionStatus
    created_at: datetime
    resolved_at: datetime | None


class ScheduleSuggestionUpdate(BaseModel):
    status: SuggestionStatus


class GenerateScheduleRequest(BaseModel):  # TODO: Verify schema
    faculty_id: int = Field(..., gt=0)
    academic_year: str = Field(..., examples=["2025/2026"])
    semester_type: SemesterType

    @field_validator("academic_year")
    def academic_year_validator(cls, v):
        if not re.fullmatch(r"\d{4}/\d{4}", v):
            raise ValueError("academic_year must be in format YYYY/YYYY")
        return v


class EmployeeAbsenceBase(BaseSchema):
    employee_id: int
    start_date: date
    end_date: date
    reason: Annotated[str, StringConstraints(max_length=255)] | None = None


class EmployeeAbsenceCreate(EmployeeAbsenceBase):
    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_date > self.end_date:
            raise ValueError("Start date must be before end date.")
        return self


class EmployeeAbsenceRead(EmployeeAbsenceBase):
    id: int
    event_id: uuid.UUID
    status: AbsenceStatus
    created_at: datetime
    updated_at: datetime | None = None


class EmployeeAbsenceUpdate(BaseModel):
    start_date: date | None = None
    end_date: date | None = None
    reason: Annotated[str, StringConstraints(max_length=255)] | None = None
    status: AbsenceStatus | None = None

    @model_validator(mode="after")
    def validate_dates_if_both_provided(self):
        if self.start_date is not None and self.end_date is not None:
            if self.start_date > self.end_date:
                raise ValueError("Start date must be before end date.")
        return self


class CourseLocation(BaseModel):
    campus: str
    building: str
    room: str


class CourseDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    course_name: str = Field(alias="courseName")
    type: str
    time: str
    location: CourseLocation
    lecturer: str
    target_audience: list[str] = Field(alias="targetAudience")


class ScheduleEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    title: str
    date: date
    start_time: str = Field(alias="startTime")
    end_time: str = Field(alias="endTime")
    variant: ClassType


class DayOfWeek(str, Enum):
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday"
    FRIDAY = "Friday"
    SATURDAY = "Saturday"
    SUNDAY = "Sunday"


class UpdateScheduleSessionRequest(BaseModel):
    day_of_week: DayOfWeek = Field(alias="dayOfWeek")
    start_time: str = Field(alias="startTime")
    end_time: str = Field(alias="endTime")
    instructor_id: int = Field(alias="instructorId")
    room_id: int = Field(alias="roomId")
    apply_once: bool = Field(
        default=False, alias="applyOnce"
    )  # todo develop in next release


class CustomEventBase(BaseSchema):
    user_id: int
    title: Annotated[str, StringConstraints(max_length=255)]
    description: Annotated[str, StringConstraints(max_length=1024)] | None = None
    event_type: CustomEventType
    start_dt: datetime
    end_dt: datetime

    related_group_id: int | None = None
    related_room_id: int | None = None
    related_session_id: uuid.UUID | None = None


class CustomEventCreate(CustomEventBase):
    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_dt > self.end_dt:
            raise ValueError("start_dt must be before or equal to end_dt")
        return self


class CustomEventRead(CustomEventBase):
    event_id: uuid.UUID
    created_by: int
    created_at: datetime
    updated_at: datetime | None = None


class CustomEventUpdate(BaseModel):
    title: Annotated[str, StringConstraints(max_length=255)] | None = None
    description: Annotated[str, StringConstraints(max_length=1024)] | None = None
    event_type: CustomEventType | None = None
    start_dt: datetime | None = None
    end_dt: datetime | None = None
    related_group_id: int | None = None
    related_room_id: int | None = None
    related_session_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def validate_if_both_dates(self):
        if self.start_dt is not None and self.end_dt is not None:
            if self.start_dt > self.end_dt:
                raise ValueError("start_dt must be before or equal to end_dt")
        return self


class ScheduleEntryWithWeekNumber(BaseModel):
    id: str
    title: str
    date: date
    start_time: str
    end_time: str
    variant: str  # ClassType
    week_number: int
    academic_day_of_week: int
    room_name: str | None = None
    instructor_name: str | None = None
class ScheduleEditInstructorOption(BaseModel):
    id: int
    name: str


class ScheduleEditRoomOption(BaseModel):
    id: int
    name: str
    building: str | None = None
    campus: str | None = None


class ScheduleEditCurrent(BaseModel):
    day_of_week: str | None
    start_time: str | None = None
    end_time: str | None = None
    instructor_id: int | None = None
    room_id: int | None = None


class ScheduleSessionEditOptions(BaseModel):
    current: ScheduleEditCurrent
    instructors: list[ScheduleEditInstructorOption]
    rooms: list[ScheduleEditRoomOption]
