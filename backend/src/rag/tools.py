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
    proposed_room_id: int | None = Field(
        None,
        description="The proposed room id of the class to reschedule",
    )
    confirmation_message: str = Field(
        ...,
        description="A short, polite confirmation message telling the user that their request has "
        "been sent to the dean's office for approval. MUST be written in the EXACT "
        "same language as the user's prompt.",
    )


class CheckAvailabilityTool(BaseModel):
    """RAG tool for checking availability of a class session."""

    session_id: str = Field(
        ...,
        description="The session id of the class to check",
    )
    proposed_timeslot_id: int = Field(
        ...,
        description="The proposed timeslot id of the class to check",
    )
