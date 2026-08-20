"""
Stock monitoring service — Agent 3 core logic.
Real Postgres-backed (StockLevel table), no in-memory state.
Sends a WhatsApp deep-link alert when a medicine has <= 7 days left,
with a 3-day cooldown so it never spams — and resets on refill
(see prescription.py confirm, which clears reorder_alert_sent_at).
"""
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models import Patient, StockLevel
from app.services.dose_service import send_whatsapp_message

REORDER_THRESHOLD_DAYS = 7
ALERT_COOLDOWN_DAYS = 3  # don't resend more than once every 3 days

STOCK_MESSAGES = {
    "en": (
        "⚠️ Stock Alert: Your {medicine} will run out in {days} day(s) "
        "({remaining} doses left). Order now:\nPharmeasy: {pharmeasy_link}\n1mg: {onemg_link}"
    ),
    "hi": (
        "⚠️ स्टॉक अलर्ट: आपकी {medicine} {days} दिन में खत्म हो जाएगी "
        "({remaining} खुराक बाकी)। अभी ऑर्डर करें:\nPharmeasy: {pharmeasy_link}\n1mg: {onemg_link}"
    ),
}


def get_pharmeasy_link(medicine_name: str) -> str:
    query = medicine_name.replace(" ", "+")
    return f"https://pharmeasy.in/search/all?name={query}"


def get_1mg_link(medicine_name: str) -> str:
    query = medicine_name.replace(" ", "-").lower()
    return f"https://www.1mg.com/search/all?name={query}"


def calculate_remaining_and_days(stock: StockLevel) -> tuple[int, int]:
    remaining = max(stock.total_quantity - stock.doses_taken, 0)
    days_left = remaining // stock.doses_per_day if stock.doses_per_day > 0 else remaining
    return remaining, days_left


async def check_and_send_reorder_alerts(db: AsyncSession) -> int:
    """
    Scans every active patient's stock, sends a WhatsApp deep-link alert
    for anything <= 7 days from running out, respecting a 3-day cooldown
    between repeat alerts. Returns how many alerts were sent.
    """
    now = datetime.now(timezone.utc)
    cooldown_cutoff = now - timedelta(days=ALERT_COOLDOWN_DAYS)

    result = await db.execute(
        select(StockLevel, Patient)
        .join(Patient, Patient.id == StockLevel.patient_id)
        .where(Patient.is_active == True)
    )
    rows = result.all()

    sent = 0
    for stock, patient in rows:
        remaining, days_left = calculate_remaining_and_days(stock)
        if days_left > REORDER_THRESHOLD_DAYS:
            continue

        if stock.reorder_alert_sent_at and stock.reorder_alert_sent_at > cooldown_cutoff:
            continue  # already alerted recently, skip

        lang = patient.language or "en"
        template = STOCK_MESSAGES.get(lang, STOCK_MESSAGES["en"])
        msg = template.format(
            medicine=stock.medicine_name,
            days=days_left,
            remaining=remaining,
            pharmeasy_link=get_pharmeasy_link(stock.medicine_name),
            onemg_link=get_1mg_link(stock.medicine_name),
        )
        send_whatsapp_message(patient.phone, msg)

        stock.reorder_alert_sent_at = now
        sent += 1

    if sent:
        await db.commit()
    return sent