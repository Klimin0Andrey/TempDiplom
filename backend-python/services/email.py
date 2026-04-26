import os
import asyncio
import aiosmtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
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
    msg["From"] = f"=?utf-8?B?{Header(safe_name, 'utf-8').encode()}?= <{MAIL_FROM}>"
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
    """Письмо-приглашение в ОРГАНИЗАЦИЮ."""
    setup_url = f"{FRONTEND_URL}/#/setup-password?token={token}"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 16px; padding: 40px;">
        <h1 style="font-size: 20px;">Welcome to {org_name}!</h1>
        <p>Hello {first_name}, you have been invited to join the team.</p>
        <div style="margin: 30px 0;">
            <a href="{setup_url}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Create My Password</a>
        </div>
    </div>
    """
    # Передаем org_name как имя отправителя
    await send_email(email, f"Invitation to join {org_name}", html, from_name=org_name)

# ИСПРАВЛЕНО: Добавлен параметр org_name
async def send_room_invite_email(email: str, room_name: str, invite_code: str, inviter_name: str, org_name: str):
    """Письмо-приглашение в КОНКРЕТНУЮ КОМНАТУ."""
    join_url = f"{FRONTEND_URL}/#/join/{invite_code}"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 16px; padding: 40px;">
        <h2 style="color: #2563eb;">Meeting Invitation</h2>
        <p><b>{inviter_name}</b> from <b>{org_name}</b> has invited you to a conference:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; font-size: 18px;">{room_name}</p>
        </div>
        <a href="{join_url}" style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Join Meeting</a>
    </div>
    """
    await send_email(email, f"Invitation: {room_name}", html, from_name=org_name)

# Обнови функцию send_reset_password_email:
async def send_reset_password_email(email: str, token: str, org_name: str):
    """Письмо сброса пароля с указанием компании."""
    reset_url = f"{FRONTEND_URL}/#/reset-password?token={token}"

    html = f"""
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 16px; padding: 40px; color: #1f2937;">
        <h2 style="color: #ef4444; margin-top: 0;">Password Reset</h2>
        <p>We received a request to reset your password for your account in <b>{org_name}</b>.</p>
        <p>Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 32px 0;">
            <a href="{reset_url}" style="background: #1f2937; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 12px; color: #9ca3af;">If you didn't request this, you can safely ignore this email.</p>
    </div>
    """
    await send_email(email, f"Reset your password for {org_name}", html, from_name=org_name)