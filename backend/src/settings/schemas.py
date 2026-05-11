from typing import Annotated
from pydantic import BaseModel, ConfigDict, StringConstraints
from ..academics import models as ac_models


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class PlannerSettingsBase(BaseSchema):
    faculty_id: int
    planned_academic_year: Annotated[str, StringConstraints(max_length=20)] | None = (
        None
    )
    planned_semester_type: ac_models.SemesterType | None = None
    is_planning_active: bool | None = True


class PlannerSettingsCreate(PlannerSettingsBase):
    pass


class PlannerSettingsRead(PlannerSettingsBase):
    id: int


class PlannerSettingsUpdate(BaseModel):
    faculty_id: int | None = None
    planned_academic_year: Annotated[str, StringConstraints(max_length=20)] | None = (
        None
    )
    planned_semester_type: ac_models.SemesterType | None = None
    is_planning_active: bool | None = None

    model_config = ConfigDict(from_attributes=True)
