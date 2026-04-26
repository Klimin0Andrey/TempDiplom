from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid



from fastapi import BackgroundTasks
from services.email import send_invite_email, send_reset_password_email
from database import get_db
from models import User, Organization, RoleEnum, StatusEnum
from schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse, UserInviteRequest, UserUpdateRequest
from security import get_password_hash, verify_password, create_access_token, create_refresh_token
from dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user. If org_name is provided, create organization and make user owner."""
    result = await db.execute(select(User).where(User.email == request.email))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    if not request.org_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization name is required for registration",
        )

    org_slug = request.org_name.lower().replace(" ", "-") + "-" + str(uuid.uuid4())[:8]
    new_org = Organization(name=request.org_name, slug=org_slug)
    db.add(new_org)
    await db.flush()

    hashed_password = get_password_hash(request.password)
    new_user = User(
        organization_id=new_org.id,
        email=request.email,
        password_hash=hashed_password,
        first_name=request.first_name,
        last_name=request.last_name,
        username=request.username,
        role=RoleEnum.owner,
        status=StatusEnum.active,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    access_token = create_access_token(str(new_user.id))
    refresh_token = create_refresh_token(str(new_user.id))

    return {
        "success": True,
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "user": new_user,
    }


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return JWT tokens."""
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalars().first()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if user.status != StatusEnum.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active",
        )

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))

    return {
        "success": True,
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "user": user,
    }


@router.post("/logout")
async def logout():
    """Logout endpoint (client-side token removal)."""
    return {"success": True, "message": "Logged out successfully"}


@router.post("/refresh")
async def refresh_token():
    """Refresh access token (placeholder)."""
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user."""
    return current_user


@router.get("/users", response_model=list[UserResponse])
async def get_organization_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all users in the current user's organization."""
    result = await db.execute(
        select(User).where(User.organization_id == current_user.organization_id)
    )
    users = result.scalars().all()
    return users


@router.post("/invite", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def invite_user(
    request: UserInviteRequest,
    background_tasks: BackgroundTasks, # Добавлено
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [RoleEnum.owner, RoleEnum.admin]:
        raise HTTPException(status_code=403, detail="Only admin or owner can invite users")

    # Проверка на существование
    existing = await db.execute(select(User).where(User.email == request.email))
    if existing.scalars().first():
        raise HTTPException(status_code=409, detail="User with this email already exists")

    # Получаем название организации для красивого письма
    org_res = await db.execute(select(Organization).where(Organization.id == current_user.organization_id))
    org = org_res.scalars().first()
    org_name = org.name if org else "IntelliConf"

    invite_token = str(uuid.uuid4())
    new_user = User(
        organization_id=current_user.organization_id,
        email=request.email,
        first_name=request.first_name,
        password_hash="invited_no_pass_" + str(uuid.uuid4())[:8],
        role=request.role,
        status=StatusEnum.invited,
        invite_token=invite_token,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # ОТПРАВКА ПИСЬМА В ФОНЕ
    background_tasks.add_task(
        send_invite_email, 
        new_user.email, 
        new_user.first_name, 
        invite_token, 
        org_name
    )

    return new_user


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    request: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update user role or status (admin/owner only)."""
    if current_user.role not in [RoleEnum.owner, RoleEnum.admin]:
        raise HTTPException(status_code=403, detail="Access denied")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user or user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="User not found in your organization")

    # ЗАЩИТА: Нельзя менять роль или статус Owner-а
    if user.role == RoleEnum.owner:
        raise HTTPException(status_code=403, detail="Cannot modify organization owner")

    # ЗАЩИТА: Нельзя деактивировать самого себя
    if str(user.id) == str(current_user.id) and request.status == StatusEnum.deactivated:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")

    if request.role:
        user.role = request.role
    if request.status:
        user.status = request.status

    await db.commit()
    await db.refresh(user)
    return user

@router.post("/forgot-password")
async def forgot_password(
    request: dict,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    email = request.get("email")
    # Используем JOIN, чтобы сразу получить имя организации пользователя
    result = await db.execute(
        select(User, Organization.name)
        .join(Organization, User.organization_id == Organization.id)
        .where(User.email == email)
    )
    row = result.first()

    if row:
        user, org_name = row
        user.invite_token = str(uuid.uuid4())
        await db.commit()
        # Передаем org_name в задачу
        background_tasks.add_task(send_reset_password_email, user.email, user.invite_token, org_name)

    return {"success": True, "message": "If this email exists, a reset link has been sent."}


@router.post("/reset-password-confirm")
async def reset_password_confirm(
    request: dict,
    db: AsyncSession = Depends(get_db),
):
    token = request.get("token")
    new_password = request.get("password")

    result = await db.execute(select(User).where(User.invite_token == token))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user.password_hash = get_password_hash(new_password)
    user.invite_token = None
    user.status = StatusEnum.active
    await db.commit()

    return {"success": True, "message": "Password updated successfully"}
