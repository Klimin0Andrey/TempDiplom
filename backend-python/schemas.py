from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime
from typing import List

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
    
# --- ROOMS SCHEMAS ---

class CreateRoomRequest(BaseModel):
    name: str
    description: Optional[str] = None
    scheduled_start_at: Optional[datetime] = None
    max_participants: Optional[int] = 50

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Room name is required")
        return v.strip()


class UpdateRoomRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    scheduled_start_at: Optional[datetime] = None


class RoomResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    invite_code: str
    invite_link: str = ""
    status: str  # RoomStatusEnum -> str
    creator_id: str
    creator_name: str = ""
    scheduled_start_at: Optional[datetime] = None
    participants_count: int = 0
    max_participants: Optional[int] = None
    is_recording: bool = False
    chat_enabled: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class RoomsListResponse(BaseModel):
    success: bool = True
    rooms: List[RoomResponse]
    total: int
    limit: int
    offset: int


class RoomDetailResponse(BaseModel):
    success: bool = True
    room: RoomResponse
    participants: List = []
    protocols: List = []
    
# --- PROTOCOLS SCHEMAS ---

class SaveProtocolRequest(BaseModel):
    room_id: str
    title: str
    content_json: dict
    summary_json: Optional[dict] = None
    decisions_json: Optional[dict] = None
    action_items_json: Optional[dict] = None
    topics_json: Optional[dict] = None


class ProtocolShortResponse(BaseModel):
    id: str
    room_id: str
    room_name: str = ""
    title: str
    summary: str = ""
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProtocolResponse(BaseModel):
    id: str
    room_id: str
    title: str
    content_json: dict
    summary_json: Optional[dict] = None
    decisions_json: Optional[dict] = None
    action_items_json: Optional[dict] = None
    topics_json: Optional[dict] = None
    pdf_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ProtocolsListResponse(BaseModel):
    success: bool = True
    protocols: list[ProtocolShortResponse]
    total: int
    
    
class UserInviteRequest(BaseModel):
    email: EmailStr
    first_name: str
    role: RoleEnum = RoleEnum.member

class UserUpdateRequest(BaseModel):
    role: Optional[RoleEnum] = None
    status: Optional[StatusEnum] = None