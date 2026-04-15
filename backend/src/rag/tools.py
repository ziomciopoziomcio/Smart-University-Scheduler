import uuid

from pydantic import BaseModel, Field


class RescheduleSuggestionTool(BaseModel):
    """RAG tool for rescheduling a class session."""

    target_class_session_id: uuid.UUID = Field(
        ...,
        description="The session id of the class to reschedule",
    )
    reason: str = Field(
        ...,
        description="The reason for the rescheduling",
    )
    proposed_timeslot_id: int | None = Field(
        None,
        description="The proposed timeslot id of the class to reschedule",
    )
    proposed_room_id: int = Field(
        None,
        description="The proposed room id of the class to reschedule",
    )
