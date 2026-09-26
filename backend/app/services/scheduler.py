"""
Background reminder scheduler. Runs inside the FastAPI process using
AsyncIOScheduler (async-native, no threading headaches with async SQLAlchemy).

Three jobs:
  1. Daily at 00:05 — pre-generate today's DoseEvent rows for every active patient
  2. Every 1 minute — send WhatsApp reminders for doses that just became due
  3. Every 1 minute — mark 2+hr-overdue doses as missed and escalate if needed

Start/stop are wired into FastAPI's startup/shutdown events in main.py.
"""
import os
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import select
from app.database.connection import AsyncSessionLocal
from app.database.models import Patient
from app.services.dose_service import (
    ensure_todays_doses,
    send_due_reminders,
    process_missed_doses_and_escalate,
)
from app.services.stock_service import check_and_send_reorder_alerts
from app.database.models import BlockedToken
from sqlalchemy import delete
from app.services.pdf_report_service import generate_weekly_report
from app.services.dose_service import send_whatsapp_message, MESSAGES
from app.services.appointment_service import (
    send_appointment_reminders_1d,
    send_appointment_reminders_2h,
    send_pre_visit_briefs,
)

logger = logging.getLogger("reminder_scheduler")
scheduler = AsyncIOScheduler()


async def job_generate_todays_doses():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Patient).where(Patient.is_active == True))
        patients = result.scalars().all()
        total_doses = 0
        for patient in patients:
            doses = await ensure_todays_doses(patient, db)
            total_doses += len(doses)
        logger.info(f"[scheduler] Daily generation done — {len(patients)} patients, {total_doses} dose rows ensured")


async def job_send_reminders():
    async with AsyncSessionLocal() as db:
        sent = await send_due_reminders(db)
        if sent:
            logger.info(f"[scheduler] Sent {sent} reminder(s)")


async def job_check_missed():
    async with AsyncSessionLocal() as db:
        missed = await process_missed_doses_and_escalate(db)
        if missed:
            logger.info(f"[scheduler] Marked {missed} dose(s) missed, escalation processed")

async def job_check_stock():
    async with AsyncSessionLocal() as db:
        sent = await check_and_send_reorder_alerts(db)
        if sent:
            logger.info(f"[scheduler] Sent {sent} stock reorder alert(s)")



async def job_cleanup_expired_tokens():
    from datetime import datetime, timezone
    async with AsyncSessionLocal() as db:
        now = datetime.now(timezone.utc)
        await db.execute(delete(BlockedToken).where(BlockedToken.expires_at < now))
        await db.commit()

async def job_generate_weekly_reports():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Patient).where(Patient.is_active == True))
        patients = result.scalars().all()

        sent = 0
        for patient in patients:
            if not patient.user_id:
                continue  # only patients with a linked login account

            try:
                report = await generate_weekly_report(patient, db)
                lang = patient.language or "en"
                templates = MESSAGES.get(lang, MESSAGES["en"])

                base_url = os.getenv("FRONTEND_BASE_URL", "http://localhost:8000")
                download_link = f"{base_url}/api/v1/reports/{report.id}/download"

                msg = templates.get("weekly_report", "📄 Your weekly health report is ready: {link}").format(link=download_link)
                send_whatsapp_message(patient.phone, msg)

                if patient.doctor_phone:
                    send_whatsapp_message(patient.doctor_phone, msg)

                sent += 1
            except Exception as e:
                logger.error(f"[scheduler] Failed to generate weekly report for patient {patient.id}: {e}")

        logger.info(f"[scheduler] Weekly reports generated for {sent} patient(s)")

async def job_appointment_reminders_1d():
    async with AsyncSessionLocal() as db:
        sent = await send_appointment_reminders_1d(db)
        if sent:
            logger.info(f"[scheduler] Sent {sent} 1-day appointment reminder(s)")


async def job_appointment_reminders_2h():
    async with AsyncSessionLocal() as db:
        sent = await send_appointment_reminders_2h(db)
        if sent:
            logger.info(f"[scheduler] Sent {sent} 2-hour appointment reminder(s)")


async def job_pre_visit_briefs():
    async with AsyncSessionLocal() as db:
        sent = await send_pre_visit_briefs(db)
        if sent:
            logger.info(f"[scheduler] Sent {sent} pre-visit brief(s)")

def start_scheduler():
    scheduler.add_job(
        job_generate_todays_doses,
        CronTrigger(hour=0, minute=5),
        id="daily_dose_generation",
        replace_existing=True,
    )
    scheduler.add_job(
        job_send_reminders,
        IntervalTrigger(minutes=1),
        id="check_due_reminders",
        replace_existing=True,
    )
    scheduler.add_job(
        job_check_missed,
        IntervalTrigger(minutes=1),
        id="check_missed_doses",
        replace_existing=True,
    )
    scheduler.add_job(
        job_check_stock,
        CronTrigger(hour=9, minute=0),
        id="check_stock_alerts",
        replace_existing=True,
    )
    scheduler.add_job(
        job_cleanup_expired_tokens,
        CronTrigger(hour=3, minute=0),
        id="cleanup_expired_tokens",
        replace_existing=True,
    )
    scheduler.add_job(
        job_generate_weekly_reports,
        CronTrigger(day_of_week="sun", hour=23, minute=0),
        id="weekly_reports",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("[scheduler] Reminder scheduler started — reminders + escalation are now live")


def stop_scheduler():
    scheduler.shutdown(wait=False)
    logger.info("[scheduler] Reminder scheduler stopped")