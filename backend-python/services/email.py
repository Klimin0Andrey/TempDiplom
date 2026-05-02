import os
import asyncio
import aiosmtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("EmailService")

SMTP_HOST = os.getenv("MAIL_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("MAIL_PORT", "587"))
SMTP_USER = os.getenv("MAIL_USERNAME")
SMTP_PASS = os.getenv("MAIL_PASSWORD")
MAIL_FROM = os.getenv("MAIL_FROM")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

BATCH_DELAY = 1.5  # секунд между письмами
MAX_RETRIES = 3
RETRY_DELAY = 2
_send_lock = asyncio.Lock()

async def send_email(to: str, subject: str, html_body: str, from_name: str = "IntelliConf"):
    """Отправка email через SMTP (STARTTLS) с защитой от rate-limiting."""
    msg = MIMEMultipart("alternative")
    display_name = f"{from_name} via Potalkyem"
    safe_name = display_name.replace("(", "").replace(")", "")
    msg["From"] = f"{from_name} via Potalkyem <{MAIL_FROM}>"
    msg["To"] = to
    msg["Subject"] = Header(subject, 'utf-8').encode()
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    async with _send_lock:  # Только одно письмо за раз
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                await aiosmtplib.send(
                    msg,
                    hostname=SMTP_HOST,
                    port=SMTP_PORT,
                    username=SMTP_USER,
                    password=SMTP_PASS,
                    use_tls=(SMTP_PORT == 465),   # True только для порта 465
                    start_tls=(SMTP_PORT == 587),  # True только для порта 587
                    timeout=15
                )
                logger.info(f"✅ [Email] Sent to {to}: {subject}")
                break  # Успешно — выходим из цикла попыток
            except Exception as e:
                logger.warning(f"⚠️ [Email] Attempt {attempt}/{MAX_RETRIES} failed for {to}: {str(e)}")
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(RETRY_DELAY * attempt)
                else:
                    logger.error(f"❌ [Email] All {MAX_RETRIES} attempts failed for {to}")
        
        # Пауза перед следующим письмом
        await asyncio.sleep(BATCH_DELAY)

async def send_invite_email(email: str, first_name: str, token: str, org_name: str):
    """Письмо-приглашение в организацию (на русском)."""
    setup_url = f"{FRONTEND_URL}/#/setup-password?token={token}"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Приглашение в организацию - Potalkyem</title>
    </head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="border-bottom: 1px solid #e0e0e0; padding: 24px 28px;">
                <div style="font-size: 18px; font-weight: 600; color: #1a73e8;">Potalkyem</div>
                <div style="font-size: 12px; color: #888888; margin-top: 4px;">Платформа для аудиоконференций</div>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px 28px;">
                <div style="font-size: 22px; font-weight: 600; color: #202124; margin-bottom: 16px;">
                    Приглашение в организацию
                </div>
                
                <p style="color: #5f6368; line-height: 1.5; margin-bottom: 24px;">
                    Здравствуйте, {first_name}!
                </p>
                
                <p style="color: #5f6368; line-height: 1.5; margin-bottom: 24px;">
                    Администратор пригласил вас присоединиться к организации <strong style="color: #1a73e8;">{org_name}</strong> 
                    на платформе аудиоконференций Potalkyem.
                </p>
                
                <p style="color: #5f6368; line-height: 1.5; margin-bottom: 16px;">
                    Для завершения регистрации и создания пароля, пожалуйста, перейдите по ссылке:
                </p>
                
                <div style="margin: 32px 0;">
                    <a href="{setup_url}" style="display: inline-block; background-color: #1a73e8; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500;">
                        Завершить регистрацию
                    </a>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 16px 20px; margin: 24px 0;">
                    <p style="color: #5f6368; font-size: 13px; margin: 0;">
                        <strong>Ссылка действительна:</strong> 7 дней
                    </p>
                    <p style="color: #5f6368; font-size: 13px; margin: 8px 0 0 0;">
                        <strong>Почта для связи:</strong> <a href="mailto:support@potalkyem.ru" style="color: #1a73e8; text-decoration: none;">support@potalkyem.ru</a>
                    </p>
                </div>
                
                <p style="color: #9aa0a6; font-size: 11px; line-height: 1.5; margin-top: 24px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
                    Если вы не ожидали это приглашение, просто проигнорируйте данное письмо.
                </p>
            </div>
            
            <!-- Footer -->
            <div style="border-top: 1px solid #e0e0e0; padding: 16px 28px; text-align: center;">
                <p style="color: #9aa0a6; font-size: 11px; margin: 0;">
                    © 2026 Potalkyem. Все права защищены.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    await send_email(email, f"Приглашение присоединиться к {org_name}", html, from_name=org_name)

async def send_room_invite_email(email: str, room_name: str, invite_code: str, inviter_name: str, org_name: str):
    """Письмо-приглашение в комнату (на русском)."""
    join_url = f"{FRONTEND_URL}/#/join/{invite_code}"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Приглашение на конференцию - Potalkyem</title>
    </head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="border-bottom: 1px solid #e0e0e0; padding: 24px 28px;">
                <div style="font-size: 18px; font-weight: 600; color: #1a73e8;">Potalkyem</div>
                <div style="font-size: 12px; color: #888888; margin-top: 4px;">Платформа для аудиоконференций</div>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px 28px;">
                <div style="font-size: 22px; font-weight: 600; color: #202124; margin-bottom: 16px;">
                    Приглашение на конференцию
                </div>
                
                <p style="color: #5f6368; line-height: 1.5; margin-bottom: 16px;">
                    {inviter_name} из организации <strong style="color: #1a73e8;">{org_name}</strong> 
                    приглашает вас принять участие в аудиоконференции.
                </p>
                
                <div style="background-color: #f8f9fa; padding: 20px; margin: 24px 0; border-left: 3px solid #1a73e8;">
                    <p style="margin: 0; font-weight: 600; color: #202124;">{room_name}</p>
                </div>
                
                <p style="color: #5f6368; line-height: 1.5; margin-bottom: 16px;">
                    Для подключения к конференции нажмите на кнопку ниже:
                </p>
                
                <div style="margin: 32px 0;">
                    <a href="{join_url}" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500;">
                        Присоединиться к конференции
                    </a>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 16px 20px; margin: 24px 0;">
                    <p style="color: #5f6368; font-size: 13px; margin: 0;">
                        <strong>Ссылка действительна:</strong> до окончания встречи
                    </p>
                    <p style="color: #5f6368; font-size: 13px; margin: 8px 0 0 0;">
                        <strong>Для участия требуется:</strong> браузер с поддержкой WebRTC (Chrome, Firefox, Edge)
                    </p>
                </div>
                
                <p style="color: #9aa0a6; font-size: 11px; line-height: 1.5; margin-top: 24px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
                    Если вы не ожидали это приглашение, просто проигнорируйте данное письмо.
                </p>
            </div>
            
            <!-- Footer -->
            <div style="border-top: 1px solid #e0e0e0; padding: 16px 28px; text-align: center;">
                <p style="color: #9aa0a6; font-size: 11px; margin: 0;">
                    © 2026 Potalkyem. Все права защищены.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    await send_email(email, f"Приглашение на конференцию: {room_name}", html, from_name=org_name)

# Обнови функцию send_reset_password_email:
async def send_reset_password_email(email: str, token: str, org_name: str):
    """Письмо сброса пароля с указанием компании (на русском)."""
    reset_url = f"{FRONTEND_URL}/#/reset-password?token={token}"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Сброс пароля - Potalkyem</title>
    </head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="border-bottom: 1px solid #e0e0e0; padding: 24px 28px;">
                <div style="font-size: 18px; font-weight: 600; color: #1a73e8;">Potalkyem</div>
                <div style="font-size: 12px; color: #888888; margin-top: 4px;">Платформа для аудиоконференций</div>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px 28px;">
                <div style="font-size: 22px; font-weight: 600; color: #202124; margin-bottom: 16px;">
                    Сброс пароля
                </div>
                
                <p style="color: #5f6368; line-height: 1.5; margin-bottom: 24px;">
                    Здравствуйте!
                </p>
                
                <p style="color: #5f6368; line-height: 1.5; margin-bottom: 24px;">
                    Мы получили запрос на сброс пароля для вашей учетной записи в организации <strong style="color: #1a73e8;">{org_name}</strong>.
                </p>
                
                <p style="color: #5f6368; line-height: 1.5; margin-bottom: 16px;">
                    Для создания нового пароля, пожалуйста, перейдите по ссылке:
                </p>
                
                <div style="margin: 32px 0;">
                    <a href="{reset_url}" style="display: inline-block; background-color: #1a73e8; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500;">
                        Сбросить пароль
                    </a>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 16px 20px; margin: 24px 0;">
                    <p style="color: #5f6368; font-size: 13px; margin: 0;">
                        <strong>Рекомендации по созданию пароля:</strong>
                    </p>
                    <p style="color: #5f6368; font-size: 13px; margin: 8px 0 0 20px;">
                        • Минимальная длина — 8 символов<br>
                        • Используйте буквы в разных регистрах<br>
                        • Добавьте цифры и специальные символы
                    </p>
                </div>
                
                <p style="color: #9aa0a6; font-size: 11px; line-height: 1.5; margin-top: 24px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
                    Ссылка действительна в течение 24 часов.<br>
                    Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.
                </p>
            </div>
            
            <!-- Footer -->
            <div style="border-top: 1px solid #e0e0e0; padding: 16px 28px; text-align: center;">
                <p style="color: #9aa0a6; font-size: 11px; margin: 0;">
                    © 2026 Potalkyem. Все права защищены.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    await send_email(email, f"Сброс пароля для {org_name}", html, from_name="Potalkyem")
    
def generate_ics_content(room_name: str, invite_code: str, org_name: str, scheduled_start_at: datetime = None) -> str:
    """Генерирует содержимое .ics файла для календаря."""
    join_url = f"{FRONTEND_URL}/#/join/{invite_code}"
    
    if not scheduled_start_at:
        scheduled_start_at = datetime.utcnow() + timedelta(hours=1)
    
    dtstart = scheduled_start_at.strftime("%Y%m%dT%H%M%SZ")
    dtend = (scheduled_start_at + timedelta(hours=1)).strftime("%Y%m%dT%H%M%SZ")
    dtstamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    uid = f"{invite_code}@potalkyem"
    
    # Кодируем русский текст
    description = f"Приглашение на конференцию в организации {org_name}\\n\\nСсылка для подключения: {join_url}"
    
    return f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Potalkyem//Conference Platform//RU
METHOD:REQUEST
BEGIN:VEVENT
UID:{uid}
DTSTAMP:{dtstamp}
DTSTART:{dtstart}
DTEND:{dtend}
SUMMARY:{room_name}
DESCRIPTION:{description}
LOCATION:Online ({join_url})
ORGANIZER;CN={org_name}:MAILTO:noreply@potalkyem.com
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR"""


async def send_room_invite_email_with_ics(
    email: str, room_name: str, invite_code: str, inviter_name: str, 
    org_name: str, scheduled_start_at: datetime = None
):
    """Письмо-приглашение в комнату с вложением .ics для календаря (на русском)."""
    join_url = f"{FRONTEND_URL}/#/join/{invite_code}"
    
    ics_content = generate_ics_content(room_name, invite_code, org_name, scheduled_start_at)
    
    msg = MIMEMultipart("mixed")
    msg["From"] = f"{org_name} <{MAIL_FROM}>"
    msg["To"] = email
    msg["Subject"] = Header(f"Приглашение на конференцию: {room_name}", 'utf-8').encode()
    
    # HTML часть
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Приглашение на конференцию - Potalkyem</title>
    </head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="border-bottom: 1px solid #e0e0e0; padding: 24px 28px;">
                <div style="font-size: 18px; font-weight: 600; color: #1a73e8;">Potalkyem</div>
                <div style="font-size: 12px; color: #888888; margin-top: 4px;">Платформа для аудиоконференций</div>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px 28px;">
                <div style="font-size: 22px; font-weight: 600; color: #202124; margin-bottom: 16px;">
                    Приглашение на конференцию
                </div>
                
                <p style="color: #5f6368; line-height: 1.5; margin-bottom: 16px;">
                    {inviter_name} из организации <strong>{org_name}</strong> 
                    приглашает вас принять участие в аудиоконференции.
                </p>
                
                <div style="background-color: #f8f9fa; padding: 20px; margin: 24px 0; border-left: 3px solid #1a73e8;">
                    <p style="margin: 0 0 8px 0; font-weight: 600; color: #202124;">{room_name}</p>
                    {'<p style="margin: 0; font-size: 13px; color: #5f6368;">🗓️ ' + scheduled_start_at.strftime("%d.%m.%Y в %H:%M") + '</p>' if scheduled_start_at else ''}
                </div>
                
                <p style="color: #5f6368; line-height: 1.5; margin-bottom: 16px;">
                    К данному письму прикреплён файл приглашения в календарь (.ics). 
                    Вы можете импортировать его в ваш календарь (Google Календарь, Outlook и др.).
                </p>
                
                <p style="color: #5f6368; line-height: 1.5; margin-bottom: 16px;">
                    Для подключения к конференции нажмите на кнопку ниже:
                </p>
                
                <div style="margin: 32px 0;">
                    <a href="{join_url}" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500;">
                        Присоединиться к конференции
                    </a>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 16px 20px; margin: 24px 0;">
                    <p style="color: #5f6368; font-size: 13px; margin: 0;">
                        <strong>Ссылка действительна:</strong> до окончания встречи
                    </p>
                    <p style="color: #5f6368; font-size: 13px; margin: 8px 0 0 0;">
                        <strong>Для участия требуется:</strong> браузер с поддержкой WebRTC (Chrome, Firefox, Edge)
                    </p>
                </div>
                
                <p style="color: #9aa0a6; font-size: 11px; line-height: 1.5; margin-top: 24px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
                    Если вы не ожидали это приглашение, просто проигнорируйте данное письмо.
                </p>
            </div>
            
            <!-- Footer -->
            <div style="border-top: 1px solid #e0e0e0; padding: 16px 28px; text-align: center;">
                <p style="color: #9aa0a6; font-size: 11px; margin: 0;">
                    © 2026 Potalkyem. Все права защищены.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    msg.attach(MIMEText(html, "html", "utf-8"))
    
    # ICS вложение
    ics_part = MIMEBase("text", "calendar", method="REQUEST", name="invite.ics")
    ics_part.set_payload(ics_content)
    ics_part.add_header("Content-Disposition", "attachment; filename=\"invite.ics\"")
    encoders.encode_base64(ics_part)
    msg.attach(ics_part)
    
    async with _send_lock:
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                await aiosmtplib.send(
                    msg,
                    hostname=SMTP_HOST,
                    port=SMTP_PORT,
                    username=SMTP_USER,
                    password=SMTP_PASS,
                    use_tls=(SMTP_PORT == 465),
                    start_tls=(SMTP_PORT == 587),
                    timeout=15
                )
                logger.info(f"✅ [Email+ICS] Sent to {email}: Invitation: {room_name}")
                break
            except Exception as e:
                logger.warning(f"⚠️ [Email+ICS] Attempt {attempt}/{MAX_RETRIES} failed for {email}: {str(e)}")
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(RETRY_DELAY * attempt)
                else:
                    logger.error(f"❌ [Email+ICS] All {MAX_RETRIES} attempts failed for {email}")
        
        await asyncio.sleep(BATCH_DELAY)
        
async def send_meeting_reminder_email(email: str, room_name: str, invite_code: str, start_time: datetime):
    """Письмо-напоминание о скором начале встречи (на русском)."""
    join_url = f"{FRONTEND_URL}/#/join/{invite_code}"
    time_str = start_time.strftime("%d.%m.%Y в %H:%M")
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Напоминание о конференции - Potalkyem</title>
    </head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="border-bottom: 1px solid #e0e0e0; padding: 24px 28px;">
                <div style="font-size: 18px; font-weight: 600; color: #1a73e8;">Potalkyem</div>
                <div style="font-size: 12px; color: #888888; margin-top: 4px;">Платформа для аудиоконференций</div>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px 28px;">
                <div style="font-size: 22px; font-weight: 600; color: #202124; margin-bottom: 16px;">
                    Напоминание о конференции
                </div>
                
                <p style="color: #5f6368; line-height: 1.5; margin-bottom: 24px;">
                    Уведомляем вас о начале запланированной конференции через 5 минут.
                </p>
                
                <div style="background-color: #f8f9fa; padding: 20px; margin: 24px 0;">
                    <p style="margin: 0 0 8px 0; font-weight: 600; color: #202124;">{room_name}</p>
                    <p style="margin: 0; font-size: 13px; color: #5f6368;">📅 {time_str}</p>
                </div>
                
                <p style="color: #5f6368; line-height: 1.5; margin-bottom: 16px;">
                    Для подключения к конференции нажмите на кнопку ниже:
                </p>
                
                <div style="margin: 32px 0;">
                    <a href="{join_url}" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500;">
                        Присоединиться к конференции
                    </a>
                </div>
                
                <div style="background-color: #f8f9fa; padding: 16px 20px; margin: 24px 0;">
                    <p style="color: #5f6368; font-size: 13px; margin: 0;">
                        <strong>Пожалуйста, подготовьте:</strong>
                    </p>
                    <p style="color: #5f6368; font-size: 13px; margin: 8px 0 0 20px;">
                        • Рабочий микрофон<br>
                        • Стабильное интернет-соединение<br>
                        • Браузер с поддержкой WebRTC
                    </p>
                </div>
                
                <p style="color: #9aa0a6; font-size: 11px; line-height: 1.5; margin-top: 24px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
                    Данное письмо было отправлено автоматически, пожалуйста, не отвечайте на него.
                </p>
            </div>
            
            <!-- Footer -->
            <div style="border-top: 1px solid #e0e0e0; padding: 16px 28px; text-align: center;">
                <p style="color: #9aa0a6; font-size: 11px; margin: 0;">
                    © 2026 Potalkyem. Все права защищены.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    await send_email(email, f"Напоминание: {room_name} начнется через 5 минут", html, from_name="Potalkyem")