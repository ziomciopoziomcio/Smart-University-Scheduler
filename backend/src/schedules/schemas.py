from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict, StringConstraints
from sqlalchemy.sql.annotation import Annotated


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
