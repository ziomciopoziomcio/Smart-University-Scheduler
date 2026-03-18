from pydantic import BaseModel


class GenerateScheduleRequest(BaseModel):  # TODO: Verify schema
    faculty_id: int
    academic_year: int
    semester: int
