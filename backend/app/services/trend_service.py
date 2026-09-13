"""
Trend detection for vitals — flags a sustained rising pattern across the
last 5 readings of the same type (BP systolic, Blood Sugar) and sends a
one-time, lower-severity WhatsApp alert per rising episode.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models import Patient, VitalReading
from app.services.dose_service import send_whatsapp_message, MESSAGES

TREND_CONFIG = {
    "bp": {"min_net_rise": 10, "label": "Blood Pressure"},
    "blood_sugar": {"min_net_rise": 20, "label": "Blood Sugar"},
}


async def check_and_alert_trend(patient: Patient, vital_type: str, db: AsyncSession) -> None:
    """
    Called after every new reading is saved for a supported vital_type.
    Looks at the last 5 readings; if they show a sustained rise, sends a
    one-time alert for that rising episode (won't re-alert every reading
    while the trend continues — only when a NEW episode starts).
    """
    if vital_type not in TREND_CONFIG:
        return

    result = await db.execute(
        select(VitalReading)
        .where(VitalReading.patient_id == patient.id, VitalReading.vital_type == vital_type)
        .order_by(VitalReading.recorded_at.desc())
        .limit(5)
    )
    readings = result.scalars().all()
    if len(readings) < 5:
        return  # not enough data yet

    readings = list(reversed(readings))  # oldest -> newest
    values = [r.value_1 for r in readings]

    config = TREND_CONFIG[vital_type]
    net_change = values[-1] - values[0]

    gaps = [values[i + 1] - values[i] for i in range(len(values) - 1)]
    non_negative_gaps = sum(1 for g in gaps if g >= 0)

    is_rising = net_change >= config["min_net_rise"] and non_negative_gaps >= 3

    latest = readings[-1]
    previous = readings[-2]

    if not is_rising:
        return

    if previous.trend_alert_sent:
        # Already alerted for this ongoing episode — just propagate the flag
        latest.trend_alert_sent = True
        await db.commit()
        return

    # Fresh rising episode — send the alert once
    lang = patient.language or "en"
    templates = MESSAGES.get(lang, MESSAGES["en"])
    msg = templates["trend_rising"].format(patient=patient.full_name, vital_label=config["label"])
    send_whatsapp_message(patient.phone, msg)

    latest.trend_alert_sent = True
    await db.commit()