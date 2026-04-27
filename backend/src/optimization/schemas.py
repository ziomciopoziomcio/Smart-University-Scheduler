import uuid

from pydantic import (
    BaseModel,
    ConfigDict,
)


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class OptimizationRequest(BaseModel):
    faculty_id: int


class OptimizationResponse(BaseModel):
    task_id: uuid.UUID
    status: str
    message: str
