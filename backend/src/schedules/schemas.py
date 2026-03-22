import uuid
from datetime import date, datetime
from typing import Optional, Annotated

from pydantic import BaseModel, Field, ConfigDict, StringConstraints, model_validator

from .models import AbsenceStatus


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class GenerateScheduleRequest(BaseModel):  # TODO: Verify schema
    faculty_id: int = Field(..., gt=0)
    academic_year: int = Field(..., ge=2000, le=2100)
    semester: int = Field(..., gt=0, le=8)


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
