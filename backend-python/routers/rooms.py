import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
import models
import schemas
from datetime import datetime, timezone
from dependencies import get_current_active_user, RequireRole
from models import RoomStatusEnum, RoleEnum
from fastapi import BackgroundTasks
from services.email import send_room_invite_email

router = APIRouter(prefix="/api/rooms", tags=["Rooms"])


def generate_invite_code() -> str:
    """Generate unique 8-char invite code."""
    return secrets.token_urlsafe(6)[:8].upper()


async def _get_room_with_permissions(
    room_id: str, db: AsyncSession, current_user: models.User
) -> models.Room:
    """Check permissions and return room."""
    result = await db.execute(
        select(models.Room).where(
            models.Room.id == room_id,
            models.Room.organization_id == current_user.organization_id,
        )
    )
    room = result.scalars().first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found in your organization")

    if (
        current_user.role not in [RoleEnum.owner, RoleEnum.admin]
        and room.creator_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    return room


# 1. СОЗДАНИЕ КОМНАТЫ
@router.post("", response_model=schemas.RoomResponse, status_code=status.HTTP_201_CREATED)
async def create_room(
    request: schemas.CreateRoomRequest,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(
        RequireRole([RoleEnum.owner, RoleEnum.admin, RoleEnum.manager])
    ),
):
    invite_code = generate_invite_code()

    new_room = models.Room(
        organization_id=current_user.organization_id,
        creator_id=current_user.id,
        name=request.name,
        description=request.description,
        invite_code=invite_code,
        status=RoomStatusEnum.scheduled,
        scheduled_start_at=request.scheduled_start_at,
    )
    db.add(new_room)
    await db.flush()

    db.add(models.Participant(
        room_id=new_room.id,
        user_id=current_user.id,
        role_in_room="organizer",
    ))
    await db.commit()
    await db.refresh(new_room)

    return {
        "id": str(new_room.id),
        "name": new_room.name,
        "description": new_room.description,
        "invite_code": new_room.invite_code,
        "invite_link": f"/join/{new_room.invite_code}",
        "status": new_room.status.value,
        "creator_id": str(new_room.creator_id),
        "creator_name": f"{current_user.first_name} {current_user.last_name or ''}".strip(),
        "scheduled_start_at": new_room.scheduled_start_at,
        "participants_count": 1,
        "max_participants": request.max_participants,
        "created_at": new_room.created_at,
        "updated_at": new_room.updated_at,
    }


# 2. СПИСОК КОМНАТ (с JOIN для имен создателей)
@router.get("", response_model=schemas.RoomsListResponse)
async def get_rooms(
    status_filter: str = Query(None, alias="status"),
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    query = (
        select(models.Room, models.User.first_name, models.User.last_name)
        .outerjoin(models.User, models.Room.creator_id == models.User.id)
        .where(models.Room.organization_id == current_user.organization_id)
    )

    # Тут ограничение по роля кто может видеть комнаты, была еще мысл сделать возможным создавать комныты с разным статусом: Приватные и открытые
    # if current_user.role not in [RoleEnum.owner, RoleEnum.admin]:
    #     participant_room_ids = select(models.Participant.room_id).where(
    #         models.Participant.user_id == current_user.id
    #     )
    #     query = query.where(
    #         (models.Room.creator_id == current_user.id)
    #         | (models.Room.id.in_(participant_room_ids))
    #     )

    if status_filter and status_filter not in ("all", "undefined", ""):
        query = query.where(models.Room.status == status_filter)

    query = query.order_by(models.Room.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    rows = result.all()

    # ОПТИМИЗАЦИЯ: Один запрос для подсчёта участников всех комнат
    room_ids = [r.id for r, _, _ in rows]
    participants_count_map = {}
    if room_ids:
        count_query = (
            select(
                models.Participant.room_id,
                func.count().label("count")
            )
            .where(models.Participant.room_id.in_(room_ids))
            .group_by(models.Participant.room_id)
        )
        count_result = await db.execute(count_query)
        participants_count_map = {row[0]: row[1] for row in count_result}

    total_result = await db.execute(
        select(func.count()).select_from(models.Room).where(
            models.Room.organization_id == current_user.organization_id
        )
    )
    total = total_result.scalar() or 0

    room_responses = []
    for r, first_name, last_name in rows:
        creator_name = (
            f"{first_name} {last_name or ''}".strip()
            if first_name
            else "Unknown"
        )
        room_responses.append({
            "id": str(r.id),
            "name": r.name,
            "description": r.description,
            "invite_code": r.invite_code,
            "invite_link": f"/join/{r.invite_code}",
            "status": r.status.value,
            "creator_id": str(r.creator_id),
            "creator_name": creator_name,
            "scheduled_start_at": r.scheduled_start_at,
            "participants_count": participants_count_map.get(r.id, 0),
            "created_at": r.created_at,
            "updated_at": r.updated_at,
        })

    return {
        "success": True,
        "rooms": room_responses,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


# 3. ДЕТАЛИ КОМНАТЫ (с JOIN для имени создателя)
@router.get("/{room_id}", response_model=schemas.RoomDetailResponse)
async def get_room_by_id(
    room_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(models.Room, models.User.first_name, models.User.last_name)
        .outerjoin(models.User, models.Room.creator_id == models.User.id)
        .where(
            models.Room.id == room_id,
            models.Room.organization_id == current_user.organization_id,
        )
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Room not found")

    room, first_name, last_name = row
    creator_name = (
        f"{first_name} {last_name or ''}".strip()
        if first_name
        else "Organizer"
    )

    part_result = await db.execute(
        select(models.Participant).where(
            models.Participant.room_id == room_id,
            models.Participant.left_at.is_(None),
        )
    )
    participants = part_result.scalars().all()

    return {
        "success": True,
        "room": {
            "id": str(room.id),
            "name": room.name,
            "description": room.description,
            "invite_code": room.invite_code,
            "invite_link": f"/join/{room.invite_code}",
            "status": room.status.value,
            "creator_id": str(room.creator_id),
            "creator_name": creator_name,
            "scheduled_start_at": room.scheduled_start_at,
            "started_at": room.started_at.isoformat() if room.started_at else None,  # ← ВОТ ЭТО ДОБАВЬ
            "ended_at": room.ended_at.isoformat() if room.ended_at else None,          # ← И ЭТО ТОЖЕ
            "duration_seconds": room.duration_seconds,                                 # ← И ЭТО
            "participants_count": len(participants),
            "chat_enabled": room.chat_enabled,
            "created_at": room.created_at,
            "updated_at": room.updated_at,
        },
        "participants": [],
        "protocols": [],
    }


# 4. ИСТОРИЯ ЧАТА
@router.get("/{room_id}/messages")
async def get_chat_history(
    room_id: str,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    check = await db.execute(
        select(models.Room).where(
            models.Room.id == room_id,
            models.Room.organization_id == current_user.organization_id,
        )
    )
    if not check.scalars().first():
        raise HTTPException(status_code=404, detail="Room not found")

    query = (
        select(models.ChatMessage, models.User.first_name, models.User.last_name)
        .outerjoin(models.User, models.ChatMessage.user_id == models.User.id)
        .where(models.ChatMessage.room_id == room_id)
        .order_by(models.ChatMessage.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    rows = result.all()

    messages = []
    for msg, first_name, last_name in reversed(rows):
        display_name = (
            f"{first_name} {last_name or ''}".strip()
            if first_name
            else "User"
        )
        messages.append({
            "id": str(msg.id),
            "user_id": str(msg.user_id) if msg.user_id else None,
            "username": display_name,
            "message": msg.message,
            "message_type": "text",
            "created_at": msg.created_at.isoformat() + "Z",
            "reply_to_id": str(msg.reply_to_id) if msg.reply_to_id else None,
        })

    return {"success": True, "messages": messages}


@router.post("/{room_id}/invite")
async def invite_to_room_by_email(
    room_id: str,
    request: dict,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    email = request.get("email")
    if not email: raise HTTPException(status_code=400, detail="Email required")

    # ИСПРАВЛЕНО: Достаем комнату и организацию одним запросом
    result = await db.execute(
        select(models.Room, models.Organization.name)
        .join(models.Organization, models.Room.organization_id == models.Organization.id)
        .where(models.Room.id == room_id)
    )
    row = result.first()
    if not row: raise HTTPException(status_code=404, detail="Room not found")
    
    room, org_name = row
    inviter = f"{current_user.first_name} {current_user.last_name or ''}".strip()

    # Передаем org_name последним аргументом
    background_tasks.add_task(
        send_room_invite_email, 
        email, 
        room.name, 
        room.invite_code, 
        inviter,
        org_name
    )
    
    return {"success": True, "message": f"Invite sent to {email}"}


@router.post("/{room_id}/invite-all")
async def invite_all_organization(
    room_id: str, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db), 
    current_user: models.User = Depends(get_current_active_user)
):
    """Разослать приглашение всем сотрудникам организации."""
    # Получаем данные комнаты и организации
    result = await db.execute(
        select(models.Room, models.Organization.name)
        .join(models.Organization, models.Room.organization_id == models.Organization.id)
        .where(models.Room.id == room_id)
    )
    row = result.first()
    if not row: raise HTTPException(status_code=404, detail="Room not found")
    room, org_name = row

    # Находим всех активных пользователей организации
    users_res = await db.execute(
        select(models.User.email)
        .where(models.User.organization_id == current_user.organization_id, models.User.status == "active")
    )
    emails = users_res.scalars().all()
    inviter = f"{current_user.first_name} {current_user.last_name or ''}".strip()

    # Массовая рассылка в фоне
    for email in emails:
        background_tasks.add_task(send_room_invite_email, email, room.name, room.invite_code, inviter, org_name)

    return {"success": True, "sent_to": len(emails)}

# 5. ОБНОВЛЕНИЕ
@router.put("/{room_id}", response_model=schemas.RoomResponse)
async def update_room(
    room_id: str,
    request: schemas.UpdateRoomRequest,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    room = await _get_room_with_permissions(room_id, db, current_user)

    if request.name is not None:
        room.name = request.name
    if request.description is not None:
        room.description = request.description
    if request.scheduled_start_at is not None:
        room.scheduled_start_at = request.scheduled_start_at

    await db.commit()
    await db.refresh(room)

    return {
        "id": str(room.id),
        "name": room.name,
        "description": room.description,
        "invite_code": room.invite_code,
        "invite_link": f"/join/{room.invite_code}",
        "status": room.status.value,
        "creator_id": str(room.creator_id),
        "creator_name": "Organizer",
        "scheduled_start_at": room.scheduled_start_at,
        "participants_count": 0,
        "created_at": room.created_at,
        "updated_at": room.updated_at,
    }


# 6. УДАЛЕНИЕ
@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(
    room_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    room = await _get_room_with_permissions(room_id, db, current_user)
    await db.delete(room)
    await db.commit()
    return None


# 7. АРХИВАЦИЯ
@router.patch("/{room_id}/archive")
async def archive_room(
    room_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    room = await _get_room_with_permissions(room_id, db, current_user)
    room.status = RoomStatusEnum.archived
    await db.commit()
    return {"success": True, "message": "Room archived"}


# 8. РЕГЕНЕРАЦИЯ INVITE
@router.post("/{room_id}/regenerate-invite")
async def regenerate_invite(
    room_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    room = await _get_room_with_permissions(room_id, db, current_user)
    room.invite_code = generate_invite_code()
    await db.commit()
    return {
        "success": True,
        "invite_code": room.invite_code,
        "invite_link": f"/join/{room.invite_code}",
    }
    
# 9. ЗАВЕРШЕНИЕ ВСТРЕЧИ
@router.patch("/{room_id}/end")
async def end_meeting(
    room_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Завершить встречу (только для организатора или админа)."""
    room = await _get_room_with_permissions(room_id, db, current_user)
    
    if room.status == RoomStatusEnum.ended:
        return {"success": True, "message": "Already ended"}
        
    room.status = RoomStatusEnum.archived
    room.ended_at = datetime.utcnow()
    
    # Считаем длительность
    if room.started_at:
        duration = room.ended_at - room.started_at
        room.duration_seconds = int(duration.total_seconds())
        
    await db.commit()
    # Уведомляем всех участников через WebSocket
    try:
        from routers.websockets import manager
        await manager.broadcast(room_id, {
            "type": "system",
            "message": "Meeting ended by organizer",
            "userId": str(current_user.id),
        })
    except Exception:
        pass  # WebSocket может быть недоступен
    
    return {"success": True, "message": "Meeting ended"}