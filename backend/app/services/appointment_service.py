"""
Appointment reminders + AI pre-visit briefs. Runs as scheduled jobs.
Each function finds appointments in a time window that haven't been
actioned yet. A *_sent_at column is stamped ONLY after WhatsApp
reports success, so a failed send is retried on the next run.
"""
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from openai import OpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database.models import Appointment, Patient
from app.services.dose_service import send_whatsapp_message, MESSAGES
from app.services.pdf_report_service import collect_week_data

IST = ZoneInfo("Asia/Kolkata")


def get_openai_client() -> OpenAI:
    return OpenAI(api_key=settings.OPENAI_API_KEY)


def format_time_12h(dt: datetime) -> str:
    """Shows the appointment time in IST for the patient and doctor."""
    local = dt.astimezone(IST)
    hour = local.hour % 12 or 12
    period = "AM" if local.hour < 12 else "PM"
    return f"{hour}:{local.minute:02d} {period}, {local.strftime('%d %b')}"


async def send_appointment_reminders_1d(db: AsyncSession) -> int:
    """WhatsApp reminder to patients whose appointment is about 24h away."""
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

        if send_whatsapp_message(patient.phone, msg):
            appt.reminder_1d_sent_at = now
            sent += 1

    if sent:
        await db.commit()
    return sent


async def send_appointment_reminders_2h(db: AsyncSession) -> int:
    """WhatsApp reminder to patients whose appointment is about 2h away."""
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

        if send_whatsapp_message(patient.phone, msg):
            appt.reminder_2h_sent_at = now
            sent += 1

    if sent:
        await db.commit()
    return sent


def generate_doctor_brief(patient_name: str, data: dict) -> str:
    """
    LLM only narrates numbers that were already computed from the DB.
    It must not invent values or suggest a diagnosis or treatment.
    """
    vitals_lines = []
    for vtype, v in data["vitals_summary"].items():
        vitals_lines.append(
            f"{v['label']}: {v['count']} readings, avg {v['avg']}, range {v['min']}-{v['max']}, "
            f"{v['watch_count']} watch, {v['critical_count']} critical"
        )
    vitals_text = "\n".join(vitals_lines) if vitals_lines else "No vitals logged in the last 14 days."

    prompt = f"""You are preparing a brief pre-visit note for a doctor about their patient {patient_name}.
Use ONLY the data below. Do not invent numbers. Do not suggest a diagnosis or treatment.
Summarize adherence and vitals patterns factually in 2-3 short sentences so the doctor
knows what to check during the visit.

Adherence (14 days): {data['adherence_pct']}% ({data['taken']} taken, {data['missed']} missed)
Vitals (14 days):
{vitals_text}
"""

    client = get_openai_client()
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=150,
        temperature=0.3,
    )
    return response.choices[0].message.content.strip()


async def send_pre_visit_briefs(db: AsyncSession) -> int:
    """Generates and sends an AI pre-visit brief about 3h before each appointment."""
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
            continue  # no doctor number on file, nowhere to send

        try:
            data = await collect_week_data(
                patient, db, now - timedelta(days=14), now
            )
            brief_text = generate_doctor_brief(patient.full_name, data)

            lang = patient.language or "en"
            templates = MESSAGES.get(lang, MESSAGES["en"])
            msg = templates["pre_visit_brief_doctor"].format(
                patient=patient.full_name,
                time=format_time_12h(appt.scheduled_at),
                brief=brief_text,
            )

            if not send_whatsapp_message(patient.doctor_phone, msg):
                print(f"⚠️  Brief not sent for appointment {appt.id}, will retry")
                continue

            appt.pre_visit_brief = brief_text
            appt.brief_sent_at = now
            await db.commit()
            sent += 1
        except Exception as e:
            print(f"⚠️  Failed to generate/send pre-visit brief for appointment {appt.id}: {e}")

    return sent