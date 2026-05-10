import uuid

from pydantic import BaseModel


class OptimizationRequest(BaseModel):
    faculty_id: int


class OptimizationResponse(BaseModel):
    task_id: uuid.UUID
    status: str
    message: str


class WorkloadIssue(BaseModel):
    course_code: int
    class_type: str
    required_hours: float
    available_hours: float


class RoomIssue(BaseModel):
    course_code: int
    group_name: list[str]
    members_amount: int
    pc_needed: bool
    projector_needed: bool


class OversizedGroupIssue(BaseModel):
    course_code: int
    class_type: str
    group_name: str
    members_amount: int
    max_capacity: int


class ValidationReport(BaseModel):
    total_genes_to_generate: int
    missing_competencies: list[str]
    workload_mismatch: list[WorkloadIssue]
    no_suitable_rooms: list[RoomIssue]
    oversized_groups: list[OversizedGroupIssue]
