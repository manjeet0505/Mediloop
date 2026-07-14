"""
Background reminder scheduler. Runs inside the FastAPI process using
AsyncIOScheduler (async-native, no threading headaches with async SQLAlchemy).

Three jobs:
  1. Daily at 00:05 — pre-generate today's DoseEvent rows for every active patient
  2. Every 1 minute — send WhatsApp reminders for doses that just became due
  3. Every 1 minute — mark 2+hr-overdue doses as missed and escalate if needed

Start/stop are wired into FastAPI's startup/shutdown events in main.py.
"""
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
    scheduler.start()
    logger.info("[scheduler] Reminder scheduler started — reminders + escalation are now live")


def stop_scheduler():
    scheduler.shutdown(wait=False)
    logger.info("[scheduler] Reminder scheduler stopped")