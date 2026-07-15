from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone, date
from app.database.connection import get_db
from app.database.models import User, Patient, DoseEvent, StockLevel
from app.utils.auth import get_current_user
from app.services.dose_service import ensure_todays_doses

router = APIRouter(prefix="/api/v1/patient", tags=["patient-portal"])

COLOR_PALETTE = ["#6366f1", "#06b6d4", "#f59e0b", "#ec4899", "#10b981", "#8b5cf6"]
DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"]  # Monday=0 ... Sunday=6


def color_for(name: str) -> str:
    return COLOR_PALETTE[hash(name) % len(COLOR_PALETTE)]


def format_time_12h(dt: datetime) -> str:
    """Cross-platform 12-hour time format (strftime %-I breaks on Windows)."""
    hour = dt.hour % 12
    if hour == 0:
        hour = 12
    period = "AM" if dt.hour < 12 else "PM"
    return f"{hour}:{dt.minute:02d} {period}"


async def get_linked_patient(current_user: User, db: AsyncSession) -> Patient:
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Patient access only")

    result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(
            status_code=404,
            detail="No patient record linked to this account. Ask your clinic for an invite code."
        )
    return patient


@router.get("/me")
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    patient = await get_linked_patient(current_user, db)
    return {
        "id": str(current_user.id),
        "patient_id": patient.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role,
    }


@router.get("/me/medicines")
async def get_my_medicines(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    patient = await get_linked_patient(current_user, db)
    doses = await ensure_todays_doses(patient, db)

    return [
        {
            "id": d.id,
            "name": d.medicine_name,
            "dosage": d.dosage or "",
            "time": format_time_12h(d.scheduled_time),
            "taken": d.status == "taken",
            "color": color_for(d.medicine_name),
        }
        for d in doses
    ]


@router.post("/me/confirm-dose/{dose_id}")
async def confirm_dose(
    dose_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    patient = await get_linked_patient(current_user, db)

    result = await db.execute(
        select(DoseEvent).where(DoseEvent.id == dose_id, DoseEvent.patient_id == patient.id)
    )
    dose = result.scalar_one_or_none()
    if not dose:
        raise HTTPException(status_code=404, detail="Dose not found")

    dose.status = "taken"
    dose.taken_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(dose)

    return {"confirmed": True, "medicine_id": dose.id, "taken_at": dose.taken_at.isoformat()}


@router.get("/me/adherence")
async def get_adherence(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    patient = await get_linked_patient(current_user, db)
    await ensure_todays_doses(patient, db)

    window_start = datetime.now(timezone.utc) - timedelta(days=7)
    result = await db.execute(
        select(DoseEvent)
        .where(DoseEvent.patient_id == patient.id, DoseEvent.scheduled_time >= window_start)
        .order_by(DoseEvent.scheduled_time)
    )
    doses = result.scalars().all()

    taken_total = sum(1 for d in doses if d.status == "taken")
    missed_total = sum(1 for d in doses if d.status == "missed")
    counted = taken_total + missed_total
    overall = round((taken_total / counted) * 100) if counted > 0 else 100

    by_day: dict = {}
    for d in doses:
        day = d.scheduled_time.date()
        by_day.setdefault(day, []).append(d)

    today = date.today()
    week = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_doses = by_day.get(day, [])
        day_counted = sum(1 for d in day_doses if d.status in ("taken", "missed"))
        day_taken = sum(1 for d in day_doses if d.status == "taken")
        pct = round((day_taken / day_counted) * 100) if day_counted > 0 else 0
        week.append({"d": DAY_LABELS[day.weekday()], "p": pct})

    streak = 0
    check_day = today
    for _ in range(60):
        day_doses = by_day.get(check_day, [])
        day_counted = sum(1 for d in day_doses if d.status in ("taken", "missed"))
        if day_counted == 0:
            check_day -= timedelta(days=1)
            continue
        day_taken = sum(1 for d in day_doses if d.status == "taken")
        if day_taken == day_counted:
            streak += 1
            check_day -= timedelta(days=1)
        else:
            break

    return {
        "overall": overall,
        "streak": streak,
        "taken_total": taken_total,
        "missed_total": missed_total,
        "week": week,
    }


@router.get("/me/stock")
async def get_stock(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    patient = await get_linked_patient(current_user, db)

    result = await db.execute(select(StockLevel).where(StockLevel.patient_id == patient.id))
    stocks = result.scalars().all()

    output = []
    for s in stocks:
        remaining = max(s.total_quantity - s.doses_taken, 0)
        days_left = remaining // s.doses_per_day if s.doses_per_day > 0 else remaining
        output.append({
            "name": s.medicine_name,
            "dosage": s.dosage or "",
            "remaining": remaining,
            "total": s.total_quantity,
            "days_left": days_left,
            "color": color_for(s.medicine_name),
        })
    return output


@router.get("/me/medicines/list")
async def get_medicines_list(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    One row per active medicine: dosage, stock, and that medicine's own
    adherence % over the last 30 days (computed from DoseEvent history).
    """
    patient = await get_linked_patient(current_user, db)

    result = await db.execute(select(StockLevel).where(StockLevel.patient_id == patient.id))
    stocks = result.scalars().all()

    window_start = datetime.now(timezone.utc) - timedelta(days=30)
    result = await db.execute(
        select(DoseEvent).where(
            DoseEvent.patient_id == patient.id,
            DoseEvent.scheduled_time >= window_start,
        )
    )
    doses = result.scalars().all()

    by_medicine: dict = {}
    for d in doses:
        by_medicine.setdefault(d.medicine_name, []).append(d)

    output = []
    for s in stocks:
        remaining = max(s.total_quantity - s.doses_taken, 0)
        days_left = remaining // s.doses_per_day if s.doses_per_day > 0 else remaining

        med_doses = by_medicine.get(s.medicine_name, [])
        taken = sum(1 for d in med_doses if d.status == "taken")
        missed = sum(1 for d in med_doses if d.status == "missed")
        counted = taken + missed
        adherence = round((taken / counted) * 100) if counted > 0 else 100

        output.append({
            "name": s.medicine_name,
            "dosage": s.dosage or "",
            "doses_per_day": s.doses_per_day,
            "remaining": remaining,
            "total": s.total_quantity,
            "days_left": days_left,
            "adherence_30d": adherence,
            "taken_30d": taken,
            "missed_30d": missed,
            "color": color_for(s.medicine_name),
        })

    return output


@router.get("/me/medicines/heatmap")
async def get_medicines_heatmap(
    weeks: int = 12,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Daily dose summary for the trailing N weeks — GitHub-contributions-style
    calendar. Each cell: date, taken count, missed count, total, pct.
    """
    patient = await get_linked_patient(current_user, db)

    days = weeks * 7
    window_start = datetime.combine(
        date.today() - timedelta(days=days - 1), datetime.min.time(), tzinfo=timezone.utc
    )

    result = await db.execute(
        select(DoseEvent).where(
            DoseEvent.patient_id == patient.id,
            DoseEvent.scheduled_time >= window_start,
        )
    )
    doses = result.scalars().all()

    by_day: dict = {}
    for d in doses:
        day = d.scheduled_time.date()
        by_day.setdefault(day, []).append(d)

    today = date.today()
    cells = []
    for i in range(days - 1, -1, -1):
        day = today - timedelta(days=i)
        day_doses = by_day.get(day, [])
        taken = sum(1 for d in day_doses if d.status == "taken")
        missed = sum(1 for d in day_doses if d.status == "missed")
        total = taken + missed
        pct = round((taken / total) * 100) if total > 0 else None  # None = no data that day

        cells.append({
            "date": day.isoformat(),
            "taken": taken,
            "missed": missed,
            "total": total,
            "pct": pct,
        })

    return {"weeks": weeks, "days": cells}