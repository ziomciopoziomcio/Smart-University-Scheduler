from pydantic import BaseModel, Field


class GenerateScheduleRequest(BaseModel):  # TODO: Verify schema
    faculty_id: int = Field(..., gt=0)
    academic_year: int = Field(..., ge=2000, le=2100)
    semester: int = Field(..., gt=0, le=8)
