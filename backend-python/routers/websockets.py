from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Dict
import json
import uuid
from datetime import datetime, timezone
from sqlalchemy import select

import security
import models
import logging
from database import AsyncSessionLocal

router = APIRouter(tags=["WebSockets"])


class ConnectionManager:
    """Управляет WebSocket-соединениями, группируя их по комнатам."""

    def __init__(self):
        # room_id -> list of (user_id, websocket)
        self.active_connections: Dict[str, list] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] =[]
        self.active_connections[room_id].append((user_id, websocket))

    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.active_connections:
            self.active_connections[room_id] =[
                (uid, ws) for (uid, ws) in self.active_connections[room_id]
                if ws != websocket
            ]
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast(self, room_id: str, message: dict, exclude_user: str = None):
        if room_id in self.active_connections:
            for uid, ws in self.active_connections[room_id]:
                if uid != exclude_user:
                    try:
                        await ws.send_json(message)
                    except Exception:
                        pass

    def get_participants(self, room_id: str) -> list:
        if room_id in self.active_connections:
            return list(set(uid for uid, _ in self.active_connections[room_id]))
        return[]


manager = ConnectionManager()


@router.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: str,
    token: str = Query(...),
):
    """Главный WebSocket эндпоинт для чата, статусов (presence) и WebRTC сигналинга."""
    
    # 1. Валидация JWT токена
    payload = security.decode_token(token)
    if payload is None:
        await websocket.close(code=1008, reason="Invalid token")
        return

    # Защита: разрешаем вход только по access-токену
    if payload.get("type") != "access":
        await websocket.close(code=1008, reason="Invalid token type")
        return

    user_id = payload.get("sub")
    if not user_id:
        await websocket.close(code=1008, reason="No user_id in token")
        return

    # 2. Получаем данные пользователя из БД
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(models.User).where(models.User.id == user_id)
        )
        user = result.scalars().first()
        username = (
            f"{user.first_name} {user.last_name or ''}".strip()
            if user
            else "Unknown User"
        )

    # 3. Подключаем пользователя к комнате
    await manager.connect(websocket, room_id, user_id)

    # Уведомляем остальных, что зашел новый участник
    await manager.broadcast(
        room_id,
        {
            "type": "system",
            "message": f"{username} joined the meeting",
            "userId": user_id,
            "username": username,
        },
        exclude_user=user_id,
    )

    # 4. Отправляем историю чата ТОЛЬКО что подключившемуся участнику
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(models.ChatMessage, models.User.first_name, models.User.last_name)
            .outerjoin(models.User, models.ChatMessage.user_id == models.User.id)
            .where(models.ChatMessage.room_id == room_id)
            .order_by(models.ChatMessage.created_at.desc()) # Сортируем от новых к старым
            .limit(50) # Берем последние 50
        )
        rows = result.all()

        history =[]
        # reversed возвращает список в хронологическом порядке (сверху вниз)
        for msg, first_name, last_name in reversed(rows):
            display_name = (
                f"{first_name} {last_name or ''}".strip()
                if first_name
                else "Unknown User"
            )
            history.append({
                "type": "chat",
                "id": str(msg.id),
                "userId": str(msg.user_id) if msg.user_id else None,
                "username": display_name,
                "message": msg.message,
                "messageType": "text",
                "createdAt": msg.created_at.isoformat(),
                "replyToId": str(msg.reply_to_id) if msg.reply_to_id else None,
            })

        if history:
            await websocket.send_json({
                "type": "chat_history",
                "messages": history,
            })

    try:
        while True:
            # Ожидаем сообщения от клиента
            data = await websocket.receive_text()
            message_data = json.loads(data)
            msg_type = message_data.get("type")

            if msg_type == "chat":
                # Рассылаем всем
                chat_msg = {
                    "type": "chat",
                    "id": str(uuid.uuid4()),
                    "userId": user_id,
                    "username": username,
                    "message": message_data.get("message"),
                    "messageType": "text",
                    "createdAt": datetime.now(timezone.utc).isoformat(),
                    "replyToId": message_data.get("reply_to_id"),
                }
                await manager.broadcast(room_id, chat_msg)

                # Сохраняем сообщение в базу
                async with AsyncSessionLocal() as db:
                    reply_to = message_data.get("reply_to_id")
                    if reply_to:
                        result = await db.execute(
                            select(models.ChatMessage).where(
                                models.ChatMessage.id == reply_to,
                                models.ChatMessage.room_id == room_id,
                            )
                        )
                        if not result.scalars().first():
                            reply_to = None

                    chat_message = models.ChatMessage(
                        room_id=room_id,
                        user_id=user_id,
                        message=message_data.get("message", ""),
                        reply_to_id=reply_to,
                    )
                    db.add(chat_message)
                    await db.commit()

            elif msg_type == "presence":
                presence_msg = {
                    "type": "presence",
                    "userId": user_id,
                    "username": username,
                    "status": message_data.get("status", "idle"),
                }
                await manager.broadcast(room_id, presence_msg, exclude_user=user_id)

            elif msg_type in ("offer", "answer", "ice-candidate"):
                target = message_data.get("target")
                signaling_msg = {
                    "type": msg_type,
                    "from": user_id,
                    "username": username,
                    "sdp": message_data.get("sdp"),
                    "candidate": message_data.get("candidate"),
                }

                if target and room_id in manager.active_connections:
                    for uid, ws in manager.active_connections[room_id]:
                        if uid == target:
                            try:
                                await ws.send_json(signaling_msg)
                            except Exception:
                                pass
                            break

    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
        await manager.broadcast(
            room_id,
            {
                "type": "system",
                "message": f"{username} left the meeting",
                "userId": user_id,
            },
        )
    except Exception as e:
        print(f"WebSocket error for user {user_id} in room {room_id}: {e}")
        manager.disconnect(room_id, websocket)