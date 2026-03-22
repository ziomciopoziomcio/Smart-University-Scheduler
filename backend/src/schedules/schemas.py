import re

from pydantic import BaseModel, Field, field_validator
from ..academics.models import SemesterType


class GenerateScheduleRequest(BaseModel):  # TODO: Verify schema
    faculty_id: int = Field(..., gt=0)
    academic_year: str = Field(..., examples=["2025/2026"])
    semester_type: SemesterType

    @field_validator("academic_year")
    def academic_year_validator(cls, v):
        if not re.match(r"^\d{4}/\d{4}$", v):
            raise ValueError("academic_year must be in format YYYY/YYYY")
        return v
