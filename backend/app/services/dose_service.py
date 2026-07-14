"""
Shared dose logic used by both the patient portal routes and the
background reminder scheduler. Single source of truth — no in-memory
state, everything reads/writes the real Postgres tables.
"""
from datetime import datetime, timedelta, timezone, date
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models import Patient, DoseEvent

# ── Message templates (console stub for now — swap send_whatsapp_message's
#    body for the real Meta Business API call later, signature stays same) ──
MESSAGES = {
    "en": {
        "reminder": "💊 Medicine Reminder: Time to take {medicine} ({dosage}). Reply 1 to confirm.",
        "family_alert": "🚨 Family Alert: {patient} has missed {count} doses recently. Please check on them.",
        "doctor_alert": "🏥 Doctor Alert: Patient {patient} has missed {count} doses. Immediate attention needed.",
    },
    "hi": {
        "reminder": "💊 दवाई याद दिलाना: {medicine} ({dosage}) लेने का समय हो गया है। पुष्टि के लिए 1 दबाएं।",
        "family_alert": "🚨 परिवार अलर्ट: {patient} ने हाल ही में {count} बार दवाई नहीं ली। कृपया जांच करें।",
        "doctor_alert": "🏥 डॉक्टर अलर्ट: मरीज {patient} ने {count} बार दवाई नहीं ली। तत्काल ध्यान चाहिए।",
    }
}


def send_whatsapp_message(phone: str, message: str) -> bool:
    """Console simulation — replace body with real WhatsApp Business API call later."""
    print(f"\n{'='*50}")
    print(f"📱 WHATSAPP → {phone}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Message: {message}")
    print(f"{'='*50}\n")
    # TODO: requests.post(WHATSAPP_API_URL, json={"to": phone, "message": message})
    return True


async def ensure_todays_doses(patient: Patient, db: AsyncSession) -> list[DoseEvent]:
    """
    Returns today's DoseEvent rows for this patient. If none exist yet,
    derive today's schedule from the most recent distinct
    (medicine, dosage, time-of-day) pattern seen in the last 14 days and
    create fresh 'pending' doses for today.
    """
    today_start = datetime.combine(date.today(), datetime.min.time(), tzinfo=timezone.utc)
    today_end = today_start + timedelta(days=1)

    result = await db.execute(
        select(DoseEvent).where(
            DoseEvent.patient_id == patient.id,
            DoseEvent.scheduled_time >= today_start,
            DoseEvent.scheduled_time < today_end,
        ).order_by(DoseEvent.scheduled_time)
    )
    todays = result.scalars().all()
    if todays:
        return todays

    lookback_start = today_start - timedelta(days=14)
    result = await db.execute(
        select(DoseEvent).where(
            DoseEvent.patient_id == patient.id,
            DoseEvent.scheduled_time >= lookback_start,
            DoseEvent.scheduled_time < today_start,
        ).order_by(DoseEvent.scheduled_time.desc())
    )
    past = result.scalars().all()

    seen = set()
    new_doses = []
    for d in past:
        key = (d.medicine_name, d.dosage, d.scheduled_time.hour, d.scheduled_time.minute)
        if key in seen:
            continue
        seen.add(key)

        scheduled = today_start.replace(hour=d.scheduled_time.hour, minute=d.scheduled_time.minute)
        new_dose = DoseEvent(
            id=str(uuid.uuid4()),
            patient_id=patient.id,
            medicine_name=d.medicine_name,
            dosage=d.dosage,
            scheduled_time=scheduled,
            status="pending",
        )
        db.add(new_dose)
        new_doses.append(new_dose)

    if new_doses:
        await db.commit()
        for nd in new_doses:
            await db.refresh(nd)

    new_doses.sort(key=lambda d: d.scheduled_time)
    return new_doses


async def send_due_reminders(db: AsyncSession) -> int:
    """
    Finds doses that are due right now and haven't been reminded yet,
    sends a WhatsApp reminder, and stamps reminder_sent_at so it never
    fires twice. Returns how many reminders were sent.
    """
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(minutes=10)  # don't spam very old backlog on first run

    result = await db.execute(
        select(DoseEvent).where(
            DoseEvent.status == "pending",
            DoseEvent.reminder_sent_at.is_(None),
            DoseEvent.scheduled_time <= now,
            DoseEvent.scheduled_time >= window_start,
        )
    )
    due_doses = result.scalars().all()
    if not due_doses:
        return 0

    sent = 0
    for dose in due_doses:
        result = await db.execute(select(Patient).where(Patient.id == dose.patient_id))
        patient = result.scalar_one_or_none()
        if not patient:
            continue

        lang = patient.language or "en"
        templates = MESSAGES.get(lang, MESSAGES["en"])
        msg = templates["reminder"].format(medicine=dose.medicine_name, dosage=dose.dosage or "")
        send_whatsapp_message(patient.phone, msg)

        dose.reminder_sent_at = now
        sent += 1

    await db.commit()
    return sent


async def process_missed_doses_and_escalate(db: AsyncSession) -> int:
    """
    Marks doses overdue by 2+ hours as 'missed', then recomputes each
    affected patient's trailing-24h missed count and escalates
    (family -> doctor) if thresholds are crossed. Returns count marked missed.
    """
    now = datetime.now(timezone.utc)
    overdue_cutoff = now - timedelta(hours=2)

    result = await db.execute(
        select(DoseEvent).where(
            DoseEvent.status == "pending",
            DoseEvent.scheduled_time <= overdue_cutoff,
        )
    )
    overdue = result.scalars().all()
    if not overdue:
        return 0

    affected_patient_ids = set()
    for dose in overdue:
        dose.status = "missed"
        affected_patient_ids.add(dose.patient_id)

    await db.commit()

    # Recompute escalation per affected patient
    window_start = now - timedelta(hours=24)
    for patient_id in affected_patient_ids:
        result = await db.execute(select(Patient).where(Patient.id == patient_id))
        patient = result.scalar_one_or_none()
        if not patient:
            continue

        result = await db.execute(
            select(DoseEvent).where(
                DoseEvent.patient_id == patient_id,
                DoseEvent.status == "missed",
                DoseEvent.scheduled_time >= window_start,
            )
        )
        missed_count = len(result.scalars().all())

        lang = patient.language or "en"
        templates = MESSAGES.get(lang, MESSAGES["en"])
        new_level = "normal"

        if missed_count >= 7:
            new_level = "emergency"
            if patient.doctor_phone and patient.escalation_level != "emergency":
                msg = templates["doctor_alert"].format(patient=patient.full_name, count=missed_count)
                send_whatsapp_message(patient.doctor_phone, msg)
        elif missed_count >= 3:
            new_level = "family"
            if patient.family_phone and patient.escalation_level not in ("family", "emergency"):
                msg = templates["family_alert"].format(patient=patient.full_name, count=missed_count)
                send_whatsapp_message(patient.family_phone, msg)

        if new_level != patient.escalation_level:
            patient.escalation_level = new_level
            patient.last_escalation_at = now

    await db.commit()
    return len(overdue)