from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
import models
import security

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> models.User:
    """Извлекает текущего пользователя из JWT токена."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    payload = security.decode_token(token)
    if payload is None:
        raise credentials_exception

    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception

    return user

async def get_current_active_user(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """Убеждаемся, что пользователь не заблокирован."""
    if current_user.status != models.StatusEnum.active:
        raise HTTPException(status_code=403, detail="Inactive user")
    return current_user


class RequireRole:
    """
    Универсальная зависимость для проверки прав доступа.
    Использование: current_user = Depends(RequireRole([models.RoleEnum.owner, models.RoleEnum.admin]))
    """
    def __init__(self, allowed_roles: list[models.RoleEnum]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: models.User = Depends(get_current_active_user)) -> models.User:
        if current_user.role not in self.allowed_roles:
            allowed_names = [role.value for role in self.allowed_roles]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of the following roles: {allowed_names}"
            )
        return current_user