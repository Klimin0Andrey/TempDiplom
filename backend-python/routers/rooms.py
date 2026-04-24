import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
import models
import schemas
from dependencies import get_current_user
from models import RoomStatusEnum

router = APIRouter(prefix="/api/rooms", tags=["Rooms"])


def generate_invite_code() -> str:
    """Generate unique 8-char invite code."""
    return secrets.token_urlsafe(6)[:8].upper()


@router.post("", response_model=schemas.RoomResponse, status_code=status.HTTP_201_CREATED)
async def create_room(
    request: schemas.CreateRoomRequest,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Create a new conference room."""
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

    # Add creator as organizer
    participant = models.Participant(
        room_id=new_room.id,
        user_id=current_user.id,
        role_in_room="organizer",
    )
    db.add(participant)
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


@router.get("", response_model=schemas.RoomsListResponse)
async def get_rooms(
    status_filter: str = Query(None, alias="status"),
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get list of rooms for the current user."""
    # Rooms where user is creator OR participant
    participant_room_ids = select(models.Participant.room_id).where(
        models.Participant.user_id == current_user.id
    )

    query = select(models.Room).where(
        (models.Room.creator_id == current_user.id)
        | (models.Room.id.in_(participant_room_ids))
    )

    if status_filter and status_filter not in ("all", "undefined", ""):
        query = query.where(models.Room.status == status_filter)

    query = query.order_by(models.Room.created_at.desc()).limit(limit).offset(offset)

    result = await db.execute(query)
    rooms = result.scalars().all()

    # Count total
    count_query = select(func.count()).select_from(models.Room).where(
        (models.Room.creator_id == current_user.id)
        | (models.Room.id.in_(participant_room_ids))
    )
    if status_filter and status_filter != "all":
        count_query = count_query.where(models.Room.status == status_filter)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    room_responses =[]
    for r in rooms:
        # Count participants
        part_count_result = await db.execute(
            select(func.count()).select_from(models.Participant).where(
                models.Participant.room_id == r.id
            )
        )
        part_count = part_count_result.scalar() or 0

        room_responses.append({
            "id": str(r.id),
            "name": r.name,
            "description": r.description,
            "invite_code": r.invite_code,
            "invite_link": f"/join/{r.invite_code}",
            "status": r.status.value,
            "creator_id": str(r.creator_id),
            "creator_name": f"{current_user.first_name} {current_user.last_name or ''}".strip(),
            "scheduled_start_at": r.scheduled_start_at,
            "participants_count": part_count,
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


@router.get("/{room_id}", response_model=schemas.RoomDetailResponse)
async def get_room_by_id(
    room_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get room details by ID."""
    result = await db.execute(
        select(models.Room).where(models.Room.id == room_id)
    )
    room = result.scalars().first()

    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Get participants
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
            "creator_name": f"{current_user.first_name} {current_user.last_name or ''}".strip(),
            "scheduled_start_at": room.scheduled_start_at,
            "participants_count": len(participants),
            "chat_enabled": room.chat_enabled,
            "created_at": room.created_at,
            "updated_at": room.updated_at,
        },
        "participants":[],
        "protocols":[],
    }

@router.get("/{room_id}/messages")
async def get_chat_history(
    room_id: str,
    limit: int = 50,
    before: str = None, # Задел на пагинацию
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get chat history for a room."""
    # Verify user has access to room
    result = await db.execute(
        select(models.Room).where(models.Room.id == room_id)
    )
    room = result.scalars().first()
    if not room:
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

    messages =[]
    for msg, first_name, last_name in reversed(rows):
        display_name = (
            f"{first_name} {last_name or ''}".strip()
            if first_name
            else "Unknown User"
        )
        messages.append({
            "id": str(msg.id),
            "userId": str(msg.user_id) if msg.user_id else None,
            "username": display_name,
            "message": msg.message,
            "messageType": "text",
            "createdAt": msg.created_at.isoformat(),
            "replyToId": str(msg.reply_to_id) if msg.reply_to_id else None,
        })

    return {"success": True, "messages": messages}


@router.put("/{room_id}", response_model=schemas.RoomResponse)
async def update_room(
    room_id: str,
    request: schemas.UpdateRoomRequest,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Update room (only creator can edit)."""
    result = await db.execute(
        select(models.Room).where(
            models.Room.id == room_id,
            models.Room.creator_id == current_user.id,
        )
    )
    room = result.scalars().first()

    if not room:
        raise HTTPException(status_code=404, detail="Room not found or access denied")

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
        "creator_name": f"{current_user.first_name} {current_user.last_name or ''}".strip(),
        "scheduled_start_at": room.scheduled_start_at,
        "participants_count": 0,
        "created_at": room.created_at,
        "updated_at": room.updated_at,
    }


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(
    room_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Delete room (only creator can delete)."""
    result = await db.execute(
        select(models.Room).where(
            models.Room.id == room_id,
            models.Room.creator_id == current_user.id,
        )
    )
    room = result.scalars().first()

    if not room:
        raise HTTPException(status_code=404, detail="Room not found or access denied")

    await db.delete(room)
    await db.commit()
    return None


@router.patch("/{room_id}/archive")
async def archive_room(
    room_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Archive room (soft delete)."""
    result = await db.execute(
        select(models.Room).where(
            models.Room.id == room_id,
            models.Room.creator_id == current_user.id,
        )
    )
    room = result.scalars().first()

    if not room:
        raise HTTPException(status_code=404, detail="Room not found or access denied")

    room.status = RoomStatusEnum.archived
    await db.commit()

    return {"success": True, "message": "Room archived"}


@router.post("/{room_id}/regenerate-invite")
async def regenerate_invite(
    room_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Regenerate invite code (only creator)."""
    result = await db.execute(
        select(models.Room).where(
            models.Room.id == room_id,
            models.Room.creator_id == current_user.id,
        )
    )
    room = result.scalars().first()

    if not room:
        raise HTTPException(status_code=404, detail="Room not found or access denied")

    room.invite_code = generate_invite_code()
    await db.commit()

    return {
        "success": True,
        "invite_code": room.invite_code,
        "invite_link": f"/join/{room.invite_code}",
    }