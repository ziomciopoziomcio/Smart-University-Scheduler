import uuid
from datetime import datetime
from typing import Annotated, Dict, Any, Optional

from pydantic import BaseModel, Field, ConfigDict, StringConstraints

from .models import SuggestionStatus


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class GenerateScheduleRequest(BaseModel):  # TODO: Verify schema
    faculty_id: int = Field(..., gt=0)
    academic_year: int = Field(..., ge=2000, le=2100)
    semester: int = Field(..., gt=0, le=8)


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
    status: Optional[SuggestionStatus] = None
