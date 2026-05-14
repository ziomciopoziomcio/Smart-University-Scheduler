import re
from typing import Annotated
from datetime import date
from pydantic import BaseModel, ConfigDict, StringConstraints, field_validator
from ..academics import models as ac_models


def default_academic_year() -> str:
    """
    Compute current academic year string in format 'YYYY/YYYY' using the rule:
    - if month >= 9 (September..December): current_year / current_year+1
    - else: (current_year-1) / current_year
    """
    today = date.today()
    year = today.year
    if today.month >= 9:
        return f"{year}/{year + 1}"
    return f"{year - 1}/{year}"


class BaseSchema(BaseModel):
    """Base Pydantic schema enabling ORM <-> Pydantic conversion (from_attributes=True)."""

    model_config = ConfigDict(from_attributes=True)


class PlannerSettingsBase(BaseSchema):
    """
    Base fields for planner settings.

    Fields:
    - faculty_id: foreign key identifying faculty this settings row belongs to.
    - planned_academic_year: human-readable academic year (e.g. "2025/2026").
    - planned_semester_type: enum value describing semester type (from academics.models).
    - is_planning_active: whether planner/GA is currently active for this faculty.
    """

    faculty_id: int
    planned_academic_year: Annotated[str, StringConstraints(max_length=20)] = Field(
        default_factory=default_academic_year
    )
    planned_semester_type: ac_models.SemesterType
    is_planning_active: bool = True

    @field_validator("planned_academic_year")
    @classmethod
    def _validate_planned_academic_year(cls, v: str) -> str:
        if not re.fullmatch(r"\d{4}/\d{4}", v):
            raise ValueError("planned_academic_year must be in format YYYY/YYYY")
        return v


class PlannerSettingsCreate(PlannerSettingsBase):
    pass


class PlannerSettingsRead(PlannerSettingsBase):
    """Response schema returned for planner settings (includes `id`)."""

    id: int


class PlannerSettingsUpdate(BaseModel):
    """
    Partial update schema for planner settings (PATCH).

    Only provided fields will be applied. `None` values are treated as explicit
    provided nulls and may be rejected for non-nullable columns by the router.
    """

    faculty_id: int | None = None
    planned_academic_year: Annotated[str, StringConstraints(max_length=20)] | None = (
        None
    )
    planned_semester_type: ac_models.SemesterType | None = None
    is_planning_active: bool | None = None

    model_config = ConfigDict(from_attributes=True)
