"""
Data validation schemas
"""

from typing import Optional, Annotated
from datetime import datetime
from pydantic import BaseModel, StringConstraints, ConfigDict


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseSchema):
    email: Annotated[str, StringConstraints(max_length=255)]
    phone_number: Optional[Annotated[str, StringConstraints(max_length=20)]] = None
    name: Annotated[str, StringConstraints(max_length=255)]
    surname: Annotated[str, StringConstraints(max_length=255)]
    grade: Optional[Annotated[str, StringConstraints(max_length=255)]] = None

class UserCreate(UserBase):
    password_hash: Annotated[str, StringConstraints(max_length=255)]

class UserRead(UserBase):
    id: int
    created_at: datetime

class UserUpdate(BaseModel):
    email: Optional[Annotated[str, StringConstraints(max_length=255)]] = None
    phone_number: Optional[Annotated[str, StringConstraints(max_length=20)]] = None
    name: Optional[Annotated[str, StringConstraints(max_length=255)]] = None
    surname: Optional[Annotated[str, StringConstraints(max_length=255)]] = None
    grade: Optional[Annotated[str, StringConstraints(max_length=255)]] = None
    password_hash: Optional[Annotated[str, StringConstraints(max_length=255)]] = None

class RoleBase(BaseSchema):
    role_name: Annotated[str, StringConstraints(max_length=255)]

class RoleCreate(RoleBase):
    pass

class RoleRead(RoleBase):
    id: int

class RoleUpdate(BaseModel):
    role_name: Optional[Annotated[str, StringConstraints(max_length=255)]] = None