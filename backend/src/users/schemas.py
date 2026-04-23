"""
Data validation schemas
"""

from datetime import datetime
from typing import Optional, Annotated, List, Any

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
    roles: list[str] = Field(default_factory=list)

    @classmethod
    def _parse_single_role(cls, role: Any) -> str:
        """
        Helper method to parse a single role object/dictionary and extract the role name.
        :param role: The input role, which can be a string, a dictionary with a 'role_name' key, or an object with a 'role_name' attribute.
        :return: The extracted role name as a string.
        """
        if isinstance(role, str):
            return role
        if isinstance(role, dict):
            role_name = role.get("role_name")
            if not isinstance(role_name, str):
                raise ValueError("Each role dictionary must contain a 'role_name'")
            return role_name
        if hasattr(role, "role_name"):
            role_name = getattr(role, "role_name")
            if not isinstance(role_name, str):
                raise ValueError("Each role object must have a 'role_name' attribute")
            return role_name

    @field_validator("roles", mode="before")
    @classmethod
    def extract_role_names(cls, v: Any) -> list[str]:
        """
        Extract role names from a list of role objects.

        :param v: The input value, expected to be a list of role objects/dictionaries.
        :return: A list of role names extracted from the input list of role objects/dictionaries.
        """
        if v is None:
            return []

        if not isinstance(v, list):
            raise ValueError("roles must be provided as a list")

        return [cls._parse_single_role(role) for role in v]


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
    users_count: int = 0


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
