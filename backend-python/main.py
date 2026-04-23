from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from dotenv import load_dotenv
from database import engine, Base, get_db
import models

load_dotenv()

app = FastAPI(
    title="Platform Core API",
    description="API для управления аудиоконференциями",
    version="1.0.0"
)

@app.on_event("startup")
async def startup():
    # При запуске создаем все таблицы в БД (для разработки)
    # В production лучше использовать Alembic миграции
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/api/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        # Проверяем подключение к БД
        await db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}