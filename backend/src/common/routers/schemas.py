from pydantic import BaseModel, EmailStr, Field


class SetupPayloadSchema(BaseModel):
    """Schema for system setup payload"""

    admin_email: EmailStr = Field(
        ...,
        description="Admin email for system setup",
    )
    admin_password: str = Field(
        ...,
        min_length=8,
        description="Admin password for system setup",
    )
    admin_name: str = Field(
        ...,
        min_length=2,
        description="Admin name for system setup",
    )
    admin_surname: str = Field(
        ...,
        min_length=2,
        description="Admin surname for system setup",
    )

    custom_role_mapping: dict[str, list[str]] | None = Field(
        default=None,
        description="Mapping of custom role names to custom role codes",
        json_schema_extra={
            "example": {
                "Administrator": ["user:view", "user:create"],
                "Student": ["schedule:view"],
            }
        },
    )
