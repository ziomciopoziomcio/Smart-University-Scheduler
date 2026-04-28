import uuid

from pydantic import BaseModel


class OptimizationRequest(BaseModel):
    faculty_id: int


class OptimizationResponse(BaseModel):
    task_id: uuid.UUID
    status: str
    message: str
