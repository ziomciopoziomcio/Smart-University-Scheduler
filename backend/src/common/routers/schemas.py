from pydantic import BaseModel, EmailStr, Field


class PlannerSettingsPayload(BaseModel):
    """
    Optional initial planner settings to create during system setup.

    Fields:
    - faculty_id: ID of the faculty these settings belong to (required when provided).
    - planned_academic_year: academic year string (e.g. "2025/2026").
    - planned_semester_type: string name of semester type (must match academics.SemesterType).
    - is_planning_active: whether planning/GA is active for this faculty.
    """

    faculty_id: int = Field(..., description="Faculty ID for planner settings")
    planned_academic_year: str | None = Field(
        default=None,
        description='Planned academic year, e.g. "2025/2026"',
        max_length=20,
    )
    planned_semester_type: str | None = Field(
        default=None,
        description="Semester type name (use values from academics.SemesterType enum)",
    )
    is_planning_active: bool | None = Field(
        default=True, description="Whether planner is active for this faculty"
    )


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
        description="Mapping of custom role names to custom permission codes",
        json_schema_extra={
            "example": {
                "Administrator": ["user:view", "user:create"],
                "Student": ["schedule:view"],
            }
        },
    )

    planner_settings: PlannerSettingsPayload | None = Field(
        default=None,
        description="Optional initial planner settings row to create during setup",
        json_schema_extra={
            "example": {
                "faculty_id": 1,
                "planned_academic_year": "2025/2026",
                "planned_semester_type": "WINTER",
                "is_planning_active": True,
            }
        },
    )
