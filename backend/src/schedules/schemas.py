import re
import uuid
from datetime import datetime, date
from typing import Annotated, Dict, Any, Optional

from pydantic import (
    BaseModel,
    Field,
    ConfigDict,
    StringConstraints,
    model_validator,
    field_validator,
)

from .models import AbsenceStatus
from .models import SuggestionStatus
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
    resolved_at: Optional[datetime]


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
    reason: Optional[Annotated[str, StringConstraints(max_length=255)]] = None


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
    updated_at: Optional[datetime] = None


class EmployeeAbsenceUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    reason: Optional[Annotated[str, StringConstraints(max_length=255)]] = None
    status: Optional[AbsenceStatus] = None

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
    courseName: str
    type: str
    time: str
    location: CourseLocation
    lecturer: str
    targetAudience: list[str]


class ScheduleEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    title: str
    date: date
    start_time: str = Field(alias="startTime")
    end_time: str = Field(alias="endTime")
    variant: ClassType
