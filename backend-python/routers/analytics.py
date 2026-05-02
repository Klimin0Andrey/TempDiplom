from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, extract
from datetime import datetime, timedelta
import models
from dependencies import get_current_user
from database import AsyncSessionLocal
from services.cache import get_cached, set_cached, invalidate_cache

router = APIRouter(tags=["Analytics"])

@router.get("/dashboard")
async def get_analytics_dashboard(current_user: models.User = Depends(get_current_user)):
    # Защита: только для админов и владельцев
    if current_user.role not in [models.RoleEnum.owner, models.RoleEnum.admin]:
        raise HTTPException(status_code=403, detail="Доступ только для руководства")

    org_id = str(current_user.organization_id)
    cache_key = f"analytics:org_{org_id}"
    
    # Пробуем получить из кэша
    cached_data = await get_cached("analytics", cache_key)
    if cached_data:
        print(f"✅ Analytics Cache HIT for {cache_key}")
        return cached_data
    
    print(f"❌ Analytics Cache MISS for {cache_key}")

    async with AsyncSessionLocal() as db:
        # 1. Всего проведено встреч
        res_meetings = await db.execute(
            select(func.count(models.Room.id)).where(models.Room.organization_id == current_user.organization_id)
        )
        total_meetings = res_meetings.scalar() or 0

        # 2. Общее время в часах
        res_duration = await db.execute(
            select(func.sum(models.Room.duration_seconds))
            .where(models.Room.organization_id == current_user.organization_id, models.Room.duration_seconds != None)
        )
        total_seconds = res_duration.scalar() or 0
        total_hours = round(total_seconds / 3600, 1)
        
        # Экономия времени AI (30% от времени встреч)
        ai_saved_hours = round(total_hours * 0.3, 1)

        # 3. Всего сотрудников
        res_users = await db.execute(
            select(func.count(models.User.id)).where(models.User.organization_id == current_user.organization_id)
        )
        total_users = res_users.scalar() or 0

        # 4. Всего протоколов
        res_protocols = await db.execute(
            select(func.count(models.Protocol.id))
            .join(models.Room, models.Protocol.room_id == models.Room.id)
            .where(models.Room.organization_id == current_user.organization_id)
        )
        total_protocols = res_protocols.scalar() or 0

        # 5. Встречи по месяцам (последние 6 месяцев)
        today = datetime.utcnow().date()
        six_months_ago = today - timedelta(days=180)
        
        res_monthly = await db.execute(
            select(
                func.date_trunc('month', models.Room.created_at).label('month'),
                func.count(models.Room.id).label('count')
            )
            .where(
                models.Room.organization_id == current_user.organization_id,
                models.Room.created_at >= six_months_ago
            )
            .group_by('month')
            .order_by('month')
        )
        monthly_meetings = [
            {"month": row.month.strftime('%b %Y'), "count": row.count}
            for row in res_monthly
        ]

        # 6. Часы пиковой активности
        res_peak_hours = await db.execute(
            select(
                extract('hour', models.Room.started_at).label('hour'),
                func.count(models.Room.id).label('count')
            )
            .where(
                models.Room.organization_id == current_user.organization_id,
                models.Room.started_at != None
            )
            .group_by('hour')
            .order_by('hour')
        )
        
        peak_hours = [
            {"hour": int(row.hour), "count": row.count}
            for row in res_peak_hours
        ]

        # 7. Самые активные пользователи
        res_active_users = await db.execute(
            select(
                models.User.first_name,
                models.User.last_name,
                func.count(models.Participant.room_id).label('meetings_count')
            )
            .join(models.Participant, models.User.id == models.Participant.user_id)
            .join(models.Room, models.Participant.room_id == models.Room.id)
            .where(
                models.User.organization_id == current_user.organization_id,
                models.Room.status == models.RoomStatusEnum.ended
            )
            .group_by(models.User.id)
            .order_by(func.count(models.Participant.room_id).desc())
            .limit(5)
        )
        
        active_users = [
            {
                "name": f"{row.first_name} {row.last_name or ''}".strip(),
                "meetings_count": row.meetings_count
            }
            for row in res_active_users
        ]

        # 8. Статусы встреч
        res_status = await db.execute(
            select(
                models.Room.status,
                func.count(models.Room.id).label('count')
            )
            .where(models.Room.organization_id == current_user.organization_id)
            .group_by(models.Room.status)
        )
        
        status_distribution = [
            {"status": row.status.value, "count": row.count}
            for row in res_status
        ]

        result_data = {
            "total_meetings": total_meetings,
            "total_hours": total_hours,
            "ai_saved_hours": ai_saved_hours,
            "total_users": total_users,
            "total_protocols": total_protocols,
            "monthly_meetings": monthly_meetings,
            "peak_hours": peak_hours,
            "active_users": active_users,
            "status_distribution": status_distribution
        }
        
        # Сохраняем в кэш на 5 минут (300 секунд)
        await set_cached("analytics", cache_key, result_data, ttl=300)
        
        return result_data