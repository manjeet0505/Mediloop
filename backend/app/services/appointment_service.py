"""
Appointment reminders + AI pre-visit briefs. Runs as scheduled jobs —
each function finds appointments in a specific time window that haven't
been actioned yet, and stamps a *_sent_at column so it never fires twice.
"""
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from openai import OpenAI
import os

from app.database.models import Appointment, Patient
from app.services.dose_service import send_whatsapp_message, MESSAGES
from app.services.pdf_report_service import collect_week_data

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def format_time_12h(dt: datetime) -> str:
    hour = dt.hour % 12
    if hour == 0:
        hour = 12
    period = "AM" if dt.hour < 12 else "PM"
    return f"{hour}:{dt.minute:02d} {period}, {dt.strftime('%d %b')}"


async def send_appointment_reminders_1d(db: AsyncSession) -> int:
    """Sends a WhatsApp reminder to patients whose appointment is ~24h away."""
    now = datetime.now(timezone.utc)
    window_start = now + timedelta(hours=23)
    window_end = now + timedelta(hours=25)

    result = await db.execute(
        select(Appointment).where(
            Appointment.status == "scheduled",
            Appointment.reminder_1d_sent_at.is_(None),
            Appointment.scheduled_at >= window_start,
            Appointment.scheduled_at <= window_end,
        )
    )
    appointments = result.scalars().all()
    sent = 0

    for appt in appointments:
        result = await db.execute(select(Patient).where(Patient.id == appt.patient_id))
        patient = result.scalar_one_or_none()
        if not patient:
            continue

        lang = patient.language or "en"
        templates = MESSAGES.get(lang, MESSAGES["en"])
        msg = templates["appointment_reminder_1d"].format(
            doctor=appt.doctor_name or "your doctor",
            time=format_time_12h(appt.scheduled_at),
        )
        send_whatsapp_message(patient.phone, msg)

        appt.reminder_1d_sent_at = now
        sent += 1

    if sent:
        await db.commit()
    return sent


async def send_appointment_reminders_2h(db: AsyncSession) -> int:
    """Sends a WhatsApp reminder to patients whose appointment is ~2h away."""
    now = datetime.now(timezone.utc)
    window_start = now + timedelta(hours=1, minutes=45)
    window_end = now + timedelta(hours=2, minutes=15)

    result = await db.execute(
        select(Appointment).where(
            Appointment.status == "scheduled",
            Appointment.reminder_2h_sent_at.is_(None),
            Appointment.scheduled_at >= window_start,
            Appointment.scheduled_at <= window_end,
        )
    )
    appointments = result.scalars().all()
    sent = 0

    for appt in appointments:
        result = await db.execute(select(Patient).where(Patient.id == appt.patient_id))
        patient = result.scalar_one_or_none()
        if not patient:
            continue

        lang = patient.language or "en"
        templates = MESSAGES.get(lang, MESSAGES["en"])
        msg = templates["appointment_reminder_2h"].format(
            doctor=appt.doctor_name or "your doctor",
            time=format_time_12h(appt.scheduled_at),
        )
        send_whatsapp_message(patient.phone, msg)

        appt.reminder_2h_sent_at = now
        sent += 1

    if sent:
        await db.commit()
    return sent


def generate_doctor_brief(patient_name: str, data: dict) -> str:
    """
    GPT-4o narrates the already-computed numbers for the doctor —
    same safety principle as the weekly report: no raw guessing,
    just summarizing real computed adherence/vitals data.
    """
    vitals_lines = []
    for vtype, v in data["vitals_summary"].items():
        vitals_lines.append(
            f"{v['label']}: {v['count']} readings, avg {v['avg']}, range {v['min']}-{v['max']}, "
            f"{v['watch_count']} watch, {v['critical_count']} critical"
        )
    vitals_text = "\n".join(vitals_lines) if vitals_lines else "No vitals logged in the last 14 days."

    prompt = f"""You are preparing a brief pre-visit note for a doctor about their patient {patient_name}.
Use ONLY the data below. Do not invent numbers, do not suggest a diagnosis or treatment —
just summarize adherence and vitals patterns factually in 2-3 short sentences so the doctor
knows what to check on during the visit.

Adherence (14 days): {data['adherence_pct']}% ({data['taken']} taken, {data['missed']} missed)
Vitals (14 days):
{vitals_text}
"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=150,
        temperature=0.3,
    )
    return response.choices[0].message.content.strip()


async def send_pre_visit_briefs(db: AsyncSession) -> int:
    """Generates + sends an AI pre-visit brief ~3h before each appointment."""
    now = datetime.now(timezone.utc)
    window_start = now + timedelta(hours=2, minutes=45)
    window_end = now + timedelta(hours=3, minutes=15)

    result = await db.execute(
        select(Appointment).where(
            Appointment.status == "scheduled",
            Appointment.brief_sent_at.is_(None),
            Appointment.scheduled_at >= window_start,
            Appointment.scheduled_at <= window_end,
        )
    )
    appointments = result.scalars().all()
    sent = 0

    for appt in appointments:
        result = await db.execute(select(Patient).where(Patient.id == appt.patient_id))
        patient = result.scalar_one_or_none()
        if not patient or not patient.doctor_phone:
            continue  # nowhere to send it

        try:
            window_end_data = now
            window_start_data = now - timedelta(days=14)
            data = await collect_week_data(patient, db, window_start_data, window_end_data)
            brief_text = generate_doctor_brief(patient.full_name, data)

            appt.pre_visit_brief = brief_text
            appt.brief_sent_at = now
            await db.commit()

            lang = patient.language or "en"
            templates = MESSAGES.get(lang, MESSAGES["en"])
            msg = templates["pre_visit_brief_doctor"].format(
                patient=patient.full_name,
                time=format_time_12h(appt.scheduled_at),
                brief=brief_text,
            )
            send_whatsapp_message(patient.doctor_phone, msg)
            sent += 1
        except Exception as e:
            print(f"⚠️  Failed to generate/send pre-visit brief for appointment {appt.id}: {e}")

    return sent