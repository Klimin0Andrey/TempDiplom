from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

# Предполагается, что эти импорты у вас есть
from models import RoleEnum, StatusEnum 

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None

    # Валидатор имени логично держать в базовом классе, 
    # чтобы он работал и при регистрации, и при обновлении профиля
    @field_validator("first_name")
    @classmethod
    def first_name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("First name is required")
        return v.strip()


class RegisterRequest(UserBase):
    password: str
    org_name: Optional[str] = None  # Если передано, создаем новую организацию

    # Валидатор пароля нужен только при регистрации (или смене пароля)
    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UserResponse(UserBase):
    id: UUID
    role: RoleEnum
    status: StatusEnum
    created_at: datetime

    # Современный способ Pydantic v2 вместо class Config:
    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    success: bool = True
    accessToken: str
    refreshToken: str
    user: UserResponse