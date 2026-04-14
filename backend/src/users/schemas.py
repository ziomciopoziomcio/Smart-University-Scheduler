"""
Data validation schemas
"""

from typing import Optional, Annotated, List, Any
from datetime import datetime
from pydantic import (
    BaseModel,
    StringConstraints,
    ConfigDict,
    EmailStr,
    model_validator,
    Field,
    field_validator,
)


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class PermissionRead(BaseSchema):
    id: int
    code: Annotated[str, StringConstraints(max_length=100)]
    name: Optional[Annotated[str, StringConstraints(max_length=100)]]
    description: Optional[Annotated[str, StringConstraints(max_length=200)]]
    group: Optional[Annotated[str, StringConstraints(max_length=50)]]


class UserBase(BaseSchema):
    email: Annotated[EmailStr, StringConstraints(max_length=255)]
    phone_number: Optional[Annotated[str, StringConstraints(max_length=20)]] = None
    name: Annotated[str, StringConstraints(max_length=255)]
    surname: Annotated[str, StringConstraints(max_length=255)]
    degree: Optional[Annotated[str, StringConstraints(max_length=255)]] = None


class UserCreate(UserBase):
    password: Annotated[str, StringConstraints(max_length=255)]


class UserRead(UserBase):
    id: int
    created_at: datetime
    roles: list[str] = []

    @field_validator("roles", mode="before")
    @classmethod
    def extract_role_names(cls, v: Any) -> list[str]:
        """
        Extract role names from a list of role objects.
        :param v: The input value, expected to be a list of role objects/dictionaries.
        :return: A list of role names extracted from the input list of role objects/dictionaries.
        """
        if v and isinstance(v, list) and hasattr(v[0], "role_name"):
            return [role.role_name for role in v]
        return v


class UserUpdate(BaseModel):
    email: Optional[Annotated[EmailStr, StringConstraints(max_length=255)]] = None
    phone_number: Optional[Annotated[str, StringConstraints(max_length=20)]] = None
    name: Optional[Annotated[str, StringConstraints(max_length=255)]] = None
    surname: Optional[Annotated[str, StringConstraints(max_length=255)]] = None
    degree: Optional[Annotated[str, StringConstraints(max_length=255)]] = None
    password: Optional[Annotated[str, StringConstraints(max_length=255)]] = None


class RoleBase(BaseSchema):
    role_name: Annotated[str, StringConstraints(max_length=255)]


class RoleCreate(RoleBase):
    permissions: List[int] = Field(default_factory=list)


class RoleRead(RoleBase):
    id: int
    permissions: List[PermissionRead] = Field(default_factory=list)


class RoleUpdate(BaseModel):
    role_name: Optional[Annotated[str, StringConstraints(max_length=255)]] = None
    permissions: Optional[List[int]] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    requires_2fa: bool = False

    model_config = ConfigDict(from_attributes=True)


class TokenData(BaseModel):
    sub: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: Annotated[EmailStr, StringConstraints(max_length=255)]
    password: Annotated[str, StringConstraints(max_length=255)]

    model_config = ConfigDict(from_attributes=True)


class TwoFactorSetup(BaseSchema):
    provisioning_uri: str
    secret: str

    model_config = ConfigDict(from_attributes=True)


class TwoFactorConfirmRequest(BaseModel):
    code: Annotated[str, StringConstraints(max_length=20)]
    model_config = ConfigDict(from_attributes=True)


class TwoFactorVerifyRequest(BaseModel):
    pre_auth_token: str
    code: Annotated[str, StringConstraints(max_length=20)]
    model_config = ConfigDict(from_attributes=True)


class BackupCodesResponse(BaseModel):
    backup_codes: List[str]
    model_config = ConfigDict(from_attributes=True)


class TwoFactorSetupResponse(BaseModel):
    provisioning_uri: str
    secret: str


class SignupRequest(BaseModel):
    email: Annotated[EmailStr, StringConstraints(max_length=255)]
    password: Annotated[str, StringConstraints(min_length=8, max_length=255)]
    password2: Annotated[str, StringConstraints(min_length=8, max_length=255)]
    name: Annotated[str, StringConstraints(max_length=255)]
    surname: Annotated[str, StringConstraints(max_length=255)]
    phone_number: Optional[Annotated[str, StringConstraints(max_length=20)]] = None
    degree: Optional[Annotated[str, StringConstraints(max_length=255)]] = None

    @model_validator(mode="after")
    def passwords_match(self):
        if getattr(self, "password", None) != getattr(self, "password2", None):
            raise ValueError("Passwords do not match")
        return self


class PasswordForgotRequest(BaseModel):
    email: Annotated[EmailStr, StringConstraints(max_length=255)]


class PasswordResetRequest(BaseModel):
    token: Annotated[str, StringConstraints(min_length=10, max_length=500)]
    password: Annotated[str, StringConstraints(min_length=8, max_length=255)]
    password2: Annotated[str, StringConstraints(min_length=8, max_length=255)]


class MessageResponse(BaseModel):
    detail: str


class PasswordChangeRequest(BaseModel):
    old_password: Annotated[str, StringConstraints(max_length=255)]
    password: Annotated[str, StringConstraints(min_length=8, max_length=255)]
    password2: Annotated[str, StringConstraints(min_length=8, max_length=255)]


class VerifyEmailResponse(BaseModel):
    detail: str
