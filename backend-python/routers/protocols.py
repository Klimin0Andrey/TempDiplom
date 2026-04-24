from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
import models
import schemas
from dependencies import get_current_user

router = APIRouter(prefix="/api/protocols", tags=["Protocols"])


@router.post("", response_model=schemas.ProtocolResponse, status_code=status.HTTP_201_CREATED)
async def save_protocol(
    request: schemas.SaveProtocolRequest,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Save AI-generated protocol."""
    # Check room exists
    result = await db.execute(
        select(models.Room).where(models.Room.id == request.room_id)
    )
    room = result.scalars().first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Create protocol
    new_protocol = models.Protocol(
        room_id=room.id,
        created_by=current_user.id,
        title=request.title,
        content_json=request.content_json,
        summary_json=request.summary_json,
        decisions_json=request.decisions_json,
        action_items_json=request.action_items_json,
        topics_json=request.topics_json,
    )
    db.add(new_protocol)
    await db.flush()

    # Extract action items
    if request.action_items_json and "action_items" in request.action_items_json:
        for item in request.action_items_json["action_items"]:
            action_item = models.ActionItem(
                protocol_id=new_protocol.id,
                room_id=room.id,
                created_by=current_user.id,
                title=item.get("task", "Untitled Task"),
                status=item.get("status", "pending"),
            )
            db.add(action_item)

    await db.commit()
    await db.refresh(new_protocol)

    # Convert UUIDs to strings for Pydantic
    return {
        "id": str(new_protocol.id),
        "room_id": str(new_protocol.room_id),
        "title": new_protocol.title,
        "content_json": new_protocol.content_json,
        "summary_json": new_protocol.summary_json,
        "decisions_json": new_protocol.decisions_json,
        "action_items_json": new_protocol.action_items_json,
        "topics_json": new_protocol.topics_json,
        "pdf_url": new_protocol.pdf_url,
        "created_at": new_protocol.created_at,
        "updated_at": new_protocol.updated_at,
    }


@router.get("", response_model=schemas.ProtocolsListResponse)
async def get_protocols(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get list of protocols for rooms where user is creator."""
    query = (
        select(models.Protocol, models.Room.name.label("room_name"))
        .join(models.Room, models.Protocol.room_id == models.Room.id)
        .where(models.Room.creator_id == current_user.id)
        .order_by(models.Protocol.created_at.desc())
    )

    result = await db.execute(query)
    rows = result.all()

    protocols_list = []
    for protocol, room_name in rows:
        summary_text = ""
        if protocol.summary_json and "summary" in protocol.summary_json:
            summary_text = protocol.summary_json["summary"]

        protocols_list.append(
            schemas.ProtocolShortResponse(
                id=str(protocol.id),
                room_id=str(protocol.room_id),
                room_name=room_name,
                title=protocol.title,
                summary=summary_text,
                created_at=protocol.created_at.isoformat(),
            )
        )

    return schemas.ProtocolsListResponse(
        success=True,
        protocols=protocols_list,
        total=len(protocols_list),
    )


@router.get("/{protocol_id}", response_model=schemas.ProtocolResponse)
async def get_protocol_by_id(
    protocol_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get full protocol by ID."""
    result = await db.execute(
        select(models.Protocol).where(models.Protocol.id == protocol_id)
    )
    protocol = result.scalars().first()

    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")

    return {
        "id": str(protocol.id),
        "room_id": str(protocol.room_id),
        "title": protocol.title,
        "content_json": protocol.content_json,
        "summary_json": protocol.summary_json,
        "decisions_json": protocol.decisions_json,
        "action_items_json": protocol.action_items_json,
        "topics_json": protocol.topics_json,
        "pdf_url": protocol.pdf_url,
        "created_at": protocol.created_at,
        "updated_at": protocol.updated_at,
    }


@router.delete("/{protocol_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_protocol(
    protocol_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Delete protocol."""
    result = await db.execute(
        select(models.Protocol).where(models.Protocol.id == protocol_id)
    )
    protocol = result.scalars().first()

    if not protocol:
        raise HTTPException(status_code=404, detail="Protocol not found")

    # Check if user is room creator
    room_result = await db.execute(
        select(models.Room).where(models.Room.id == protocol.room_id)
    )
    room = room_result.scalars().first()

    if not room or str(room.creator_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")

    await db.delete(protocol)
    await db.commit()
    return None