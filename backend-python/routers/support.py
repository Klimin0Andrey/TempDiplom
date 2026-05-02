from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import os
import logging
from services.email import send_email
from dependencies import get_current_user

router = APIRouter(prefix="/support", tags=["support"])
logger = logging.getLogger(__name__)

SUPPORT_EMAIL = os.getenv("SUPPORT_EMAIL", "potalkyem412@gmail.com")

class ContactRequest(BaseModel):
    subject: str
    message: str
    category: str

@router.post("/contact")
async def send_support_message(
    request: ContactRequest,
    current_user = Depends(get_current_user)
):
    """Отправка сообщения в поддержку на почту компании"""
    try:
        # Письмо в поддержку
        html = f"""
        <div style="font-family: sans-serif; padding: 20px;">
            <h2>Новое обращение в поддержку</h2>
            <p><strong>От:</strong> {current_user.email}</p>
            <p><strong>Имя:</strong> {current_user.first_name} {current_user.last_name}</p>
            <p><strong>Категория:</strong> {request.category}</p>
            <p><strong>Тема:</strong> {request.subject}</p>
            <hr/>
            <p><strong>Сообщение:</strong></p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
                {request.message}
            </div>
            <p style="font-size: 12px; color: #666; margin-top: 20px;">
                Отправлено через форму поддержки Potalkyem
            </p>
        </div>
        """
        
        await send_email(
            to=SUPPORT_EMAIL,
            subject=f"[Поддержка] {request.subject}",
            html_body=html,
            from_name=current_user.first_name or "Пользователь"
        )
        
        # Письмо-подтверждение пользователю
        user_html = f"""
        <div style="font-family: sans-serif; padding: 20px; background: #f9fafb;">
            <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 24px;">
                <h2 style="color: #2563eb; margin-top: 0;">✅ Ваше обращение получено!</h2>
                <p>Здравствуйте, <strong>{current_user.first_name or current_user.email}</strong>!</p>
                <p>Мы получили ваше обращение и ответим в ближайшее время.</p>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-weight: bold;">Ваше сообщение:</p>
                    <p style="margin: 10px 0 0 0; color: #4b5563;">{request.message}</p>
                </div>
                <p style="font-size: 14px; color: #6b7280;">📅 Обычно мы отвечаем в течение 2 часов.</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;"/>
                <p style="font-size: 12px; color: #9ca3af;">С уважением,<br/>Команда Potalkyem</p>
            </div>
        </div>
        """
        
        await send_email(
            to=current_user.email,
            subject="Ваше обращение получено - Potalkyem",
            html_body=user_html,
            from_name="Поддержка Potalkyem"
        )
        
        return {"success": True, "message": "Message sent"}
    except Exception as e:
        logger.error(f"Failed to send support message: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")