from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone
from app.database.connection import get_db
from app.database.models import User, Patient, DoseEvent, StockLevel, Prescription
from app.utils.auth import get_current_user
from app.config import settings  # for whatsapp_access_token presence check

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])

LOW_STOCK_DAYS_THRESHOLD = 3
MISSED_DOSE_ALERT_THRESHOLD = 3  # consecutive/weekly missed doses that trigger an alert
ADHERENCE_ACTIVE = 80
ADHERENCE_WARNING = 50
NEW_PATIENT_WINDOW_DAYS = 3


def humanize_ago(dt: datetime | None) -> str:
    if dt is None:
        return "No activity yet"
    now = datetime.now(timezone.utc)
    delta = now - dt
    secs = int(delta.total_seconds())
    if secs < 60:
        return "Just now"
    mins = secs // 60
    if mins < 60:
        return f"{mins}m ago"
    hours = mins // 60
    if hours < 24:
        return f"{hours}h ago"
    days = hours // 24
    return f"{days}d ago"


@router.get("/summary")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "clinic":
        raise HTTPException(status_code=403, detail="Clinic access only")

    # ---- 1. Fetch all active patients for this clinic ----
    result = await db.execute(
        select(Patient).where(Patient.clinic_id == current_user.id, Patient.is_active == True)
    )
    patients = result.scalars().all()
    patient_ids = [p.id for p in patients]

    if not patient_ids:
        return {
            "patients": [],
            "alerts": [],
            "agents": {"prescriptions_today": 0, "reminders_today": 0, "active_alerts": 0},
            "system_status": await _system_status(db),
        }

    # ---- 2. Bulk-fetch dose events for last 30 days (covers 7d adherence + missed-streak logic) ----
    window_start = datetime.now(timezone.utc) - timedelta(days=30)
    result = await db.execute(
        select(DoseEvent).where(
            DoseEvent.patient_id.in_(patient_ids),
            DoseEvent.scheduled_time >= window_start,
        )
    )
    all_doses = result.scalars().all()

    by_patient: dict[str, list[DoseEvent]] = {}
    for d in all_doses:
        by_patient.setdefault(d.patient_id, []).append(d)

    # ---- 3. Bulk-fetch stock levels (for low-stock alerts) ----
    result = await db.execute(select(StockLevel).where(StockLevel.patient_id.in_(patient_ids)))
    all_stock = result.scalars().all()
    stock_by_patient: dict[str, list[StockLevel]] = {}
    for s in all_stock:
        stock_by_patient.setdefault(s.patient_id, []).append(s)

    # ---- 4. Build per-patient rows (real adherence/status/lastSeen) ----
    week_start = datetime.now(timezone.utc) - timedelta(days=7)
    now = datetime.now(timezone.utc)

    patient_rows = []
    alerts = []
    reminders_today_count = 0

    for p in patients:
        doses = by_patient.get(p.id, [])
        week_doses = [d for d in doses if d.scheduled_time >= week_start]
        taken = sum(1 for d in week_doses if d.status == "taken")
        missed = sum(1 for d in week_doses if d.status == "missed")
        counted = taken + missed
        adherence = round((taken / counted) * 100) if counted > 0 else 100

        # last activity = most recent taken/missed dose event
        acted_doses = [d for d in doses if d.status in ("taken", "missed")]
        last_dose = max(acted_doses, key=lambda d: d.taken_at or d.scheduled_time) if acted_doses else None
        last_seen_dt = (last_dose.taken_at if last_dose and last_dose.taken_at else last_dose.scheduled_time) if last_dose else None

        is_new = (now - p.created_at) <= timedelta(days=NEW_PATIENT_WINDOW_DAYS) if p.created_at else False

        if is_new and counted == 0:
            status = "new"
        elif adherence >= ADHERENCE_ACTIVE:
            status = "active"
        elif adherence >= ADHERENCE_WARNING:
            status = "warning"
        else:
            status = "critical"

        patient_rows.append({
            "id": p.id,
            "full_name": p.full_name,
            "adherence": adherence,
            "status": status,
            "last_seen": humanize_ago(last_seen_dt),
        })

        # reminders "sent" today — real signal via DoseEvent.reminder_sent_at
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        reminders_today_count += sum(
            1 for d in doses if d.reminder_sent_at is not None and d.reminder_sent_at >= today_start
        )

        # missed-dose alert
        if missed >= MISSED_DOSE_ALERT_THRESHOLD:
            alerts.append({
                "type": "missed_doses",
                "severity": "critical" if missed >= MISSED_DOSE_ALERT_THRESHOLD + 2 else "warning",
                "message": f"{p.full_name}: {missed} missed doses this week",
                "patient_id": p.id,
            })

    # ---- 5. Low-stock alerts ----
    for s in all_stock:
        remaining = max(s.total_quantity - s.doses_taken, 0)
        days_left = remaining // s.doses_per_day if s.doses_per_day > 0 else remaining
        if days_left <= LOW_STOCK_DAYS_THRESHOLD:
            patient_name = next((p.full_name for p in patients if p.id == s.patient_id), "Unknown")
            alerts.append({
                "type": "low_stock",
                "severity": "critical" if days_left <= 1 else "warning",
                "message": f"{patient_name}: {s.medicine_name} depletes in {days_left} day(s)",
                "patient_id": s.patient_id,
            })

    alerts.sort(key=lambda a: 0 if a["severity"] == "critical" else 1)

    # ---- 6. Agent metrics ----
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    result = await db.execute(
        select(Prescription).where(
            Prescription.patient_id.in_(patient_ids),
            Prescription.created_at >= today_start,
        )
    )
    prescriptions_today = len(result.scalars().all())

    agents = {
        "prescriptions_today": prescriptions_today,
        "reminders_today": reminders_today_count,
        "active_alerts": len(alerts),
    }

    return {
        "patients": patient_rows,
        "alerts": alerts[:10],
        "agents": agents,
        "system_status": await _system_status(db),
    }


async def _system_status(db: AsyncSession) -> dict:
    # DB check
    try:
        await db.execute(select(1))
        db_ok = True
    except Exception:
        db_ok = False

    # WhatsApp check — presence of configured credentials as a baseline signal.
    # For a stronger check, ping Meta Graph API's /me endpoint with the access token instead.
    whatsapp_ok = bool(getattr(settings, "whatsapp_access_token", None))

    return {
        "database": "operational" if db_ok else "down",
        "whatsapp_api": "operational" if whatsapp_ok else "not configured",
    }