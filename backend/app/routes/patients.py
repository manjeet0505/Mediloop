from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone, date
from app.database.connection import get_db
from app.database.models import User, Patient, DoseEvent, StockLevel, Prescription
from app.database.schemas import PatientCreate, PatientResponse
from app.utils.auth import get_current_user
from app.utils.validators import validate_phone, validate_name
import uuid
import random

router = APIRouter(prefix="/api/v1/patients", tags=["Patient Management"])

INVITE_CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
COLOR_PALETTE = ["#6366f1", "#06b6d4", "#f59e0b", "#ec4899", "#10b981", "#8b5cf6"]


def color_for(name: str) -> str:
    return COLOR_PALETTE[hash(name) % len(COLOR_PALETTE)]


async def generate_unique_invite_code(db: AsyncSession) -> str:
    for _ in range(10):
        code = "".join(random.choices(INVITE_CODE_CHARS, k=6))
        result = await db.execute(select(Patient).where(Patient.invite_code == code))
        if not result.scalar_one_or_none():
            return code
    raise HTTPException(status_code=500, detail="Could not generate unique invite code, try again")


async def get_owned_patient(patient_id: str, current_user: User, db: AsyncSession) -> Patient:
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.clinic_id == current_user.id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.post("/", response_model=PatientResponse)
async def create_patient(
    data: PatientCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    validate_name(data.full_name)
    validate_phone(data.phone)
    if data.family_phone:
        validate_phone(data.family_phone)
    if data.doctor_phone:
        validate_phone(data.doctor_phone)

    invite_code = await generate_unique_invite_code(db)

    patient = Patient(
        id=str(uuid.uuid4()),
        clinic_id=current_user.id,
        full_name=data.full_name,
        phone=data.phone,
        family_phone=data.family_phone,
        doctor_phone=data.doctor_phone,
        age=data.age,
        language=data.language,
        invite_code=invite_code,
    )
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    return PatientResponse.model_validate(patient)


@router.get("/", response_model=list[PatientResponse])
async def list_patients(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Patient).where(Patient.clinic_id == current_user.id).order_by(Patient.created_at.desc())
    )
    patients = result.scalars().all()
    return [PatientResponse.model_validate(p) for p in patients]


@router.get("/stock/all")
async def get_all_stock(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "clinic":
        raise HTTPException(status_code=403, detail="Clinic access only")

    result = await db.execute(
        select(Patient).where(Patient.clinic_id == current_user.id, Patient.is_active == True)
    )
    patients = result.scalars().all()
    patient_map = {p.id: p.full_name for p in patients}

    if not patient_map:
        return []

    result = await db.execute(select(StockLevel).where(StockLevel.patient_id.in_(patient_map.keys())))
    stocks = result.scalars().all()

    window_start_date = date.today() - timedelta(days=13)
    window_start_dt = datetime.combine(window_start_date, datetime.min.time(), tzinfo=timezone.utc)

    output = []
    for s in stocks:
        remaining = max(s.total_quantity - s.doses_taken, 0)
        days_left = remaining // s.doses_per_day if s.doses_per_day > 0 else remaining

        result = await db.execute(
            select(DoseEvent).where(
                DoseEvent.patient_id == s.patient_id,
                DoseEvent.medicine_name == s.medicine_name,
                DoseEvent.status == "taken",
                DoseEvent.taken_at >= window_start_dt,
            )
        )
        taken_events = result.scalars().all()
        daily_taken: dict = {}
        for d in taken_events:
            day = d.taken_at.date()
            daily_taken[day] = daily_taken.get(day, 0) + 1

        total_taken_in_window = sum(daily_taken.values())
        running = remaining + total_taken_in_window
        trend = []
        for i in range(14):
            day = window_start_date + timedelta(days=i)
            running -= daily_taken.get(day, 0)
            trend.append(max(running, 0))

        output.append({
            "patient_id": s.patient_id,
            "patient_name": patient_map.get(s.patient_id, "Unknown"),
            "medicine_name": s.medicine_name,
            "dosage": s.dosage or "",
            "remaining": remaining,
            "total": s.total_quantity,
            "days_left": days_left,
            "trend": trend,
            "color": color_for(s.medicine_name),
        })

    output.sort(key=lambda x: x["days_left"])
    return output

@router.get("/dashboard-summary")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Single call for the clinic dashboard: patient list with real adherence,
    live alerts (stock + missed doses), and today's agent activity counts.
    Everything here is computed from real DB rows — nothing hardcoded.
    """
    if current_user.role != "clinic":
        raise HTTPException(status_code=403, detail="Clinic access only")

    result = await db.execute(
        select(Patient).where(Patient.clinic_id == current_user.id, Patient.is_active == True)
    )
    patients = result.scalars().all()

    if not patients:
        return {
            "patients": [],
            "alerts": [],
            "agent_metrics": {
                "prescriptions_parsed_today": 0,
                "reminders_sent_today": 0,
                "active_stock_alerts": 0,
            },
        }

    patient_ids = [p.id for p in patients]
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=7)
    today_start = datetime.combine(date.today(), datetime.min.time(), tzinfo=timezone.utc)

    # 7-day dose history for every patient in one query
    result = await db.execute(
        select(DoseEvent).where(
            DoseEvent.patient_id.in_(patient_ids),
            DoseEvent.scheduled_time >= week_start,
        )
    )
    doses = result.scalars().all()

    by_patient: dict = {}
    for d in doses:
        by_patient.setdefault(d.patient_id, []).append(d)

    # Stock levels for every patient in one query
    result = await db.execute(select(StockLevel).where(StockLevel.patient_id.in_(patient_ids)))
    stocks = result.scalars().all()
    stock_by_patient: dict = {}
    for s in stocks:
        stock_by_patient.setdefault(s.patient_id, []).append(s)

    patient_rows = []
    alerts = []
    reminders_sent_today = 0

    for p in patients:
        p_doses = by_patient.get(p.id, [])
        taken = sum(1 for d in p_doses if d.status == "taken")
        missed = sum(1 for d in p_doses if d.status == "missed")
        counted = taken + missed
        adherence = round((taken / counted) * 100) if counted > 0 else None

        taken_events = [d for d in p_doses if d.status == "taken" and d.taken_at]
        last_activity = max((d.taken_at for d in taken_events), default=None)

        reminders_sent_today += sum(
            1 for d in p_doses
            if d.reminder_sent_at and d.reminder_sent_at >= today_start
        )

        is_new = p.created_at and p.created_at >= week_start
        if p.escalation_level == "emergency":
            status = "critical"
        elif p.escalation_level == "family":
            status = "warning"
        elif is_new:
            status = "new"
        else:
            status = "active"

        patient_rows.append({
            "id": p.id,
            "full_name": p.full_name,
            "age": p.age,
            "adherence_7d": adherence,
            "status": status,
            "last_activity": last_activity.isoformat() if last_activity else None,
        })

        if p.escalation_level in ("family", "emergency"):
            alerts.append({
                "type": "missed_doses",
                "title": f"{missed} missed dose(s)",
                "patient_name": p.full_name,
                "severity": "critical" if p.escalation_level == "emergency" else "warning",
            })

        for s in stock_by_patient.get(p.id, []):
            remaining = max(s.total_quantity - s.doses_taken, 0)
            days_left = remaining // s.doses_per_day if s.doses_per_day > 0 else remaining
            if days_left <= 7:
                alerts.append({
                    "type": "stock_critical",
                    "title": f"{s.medicine_name} · {days_left} day(s) left",
                    "patient_name": p.full_name,
                    "severity": "critical" if days_left <= 3 else "warning",
                })

    result = await db.execute(
        select(Prescription).where(
            Prescription.patient_id.in_(patient_ids),
            Prescription.created_at >= today_start,
        )
    )
    prescriptions_today = len(result.scalars().all())

    active_stock_alerts = sum(1 for a in alerts if a["type"] == "stock_critical")

    return {
        "patients": patient_rows,
        "alerts": alerts,
        "agent_metrics": {
            "prescriptions_parsed_today": prescriptions_today,
            "reminders_sent_today": reminders_sent_today,
            "active_stock_alerts": active_stock_alerts,
        },
    }

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    patient = await get_owned_patient(patient_id, current_user, db)
    return PatientResponse.model_validate(patient)


@router.get("/{patient_id}/medicines")
async def get_patient_medicines(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    patient = await get_owned_patient(patient_id, current_user, db)

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
            "color": color_for(s.medicine_name),
        })

    return output


@router.get("/{patient_id}/dose-history")
async def get_patient_dose_history(
    patient_id: str,
    days: int = 14,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Real dose log for the Patient Detail page's Dose History tab —
    trailing N days, newest first, plus this week's adherence %.
    """
    patient = await get_owned_patient(patient_id, current_user, db)

    window_start = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(DoseEvent)
        .where(DoseEvent.patient_id == patient.id, DoseEvent.scheduled_time >= window_start)
        .order_by(DoseEvent.scheduled_time.desc())
    )
    doses = result.scalars().all()

    history = [
        {
            "id": d.id,
            "medicine_name": d.medicine_name,
            "dosage": d.dosage or "",
            "scheduled_time": d.scheduled_time.isoformat(),
            "status": d.status,
            "taken_at": d.taken_at.isoformat() if d.taken_at else None,
        }
        for d in doses
    ]

    # this week's adherence (last 7 days)
    week_start = datetime.now(timezone.utc) - timedelta(days=7)
    week_doses = [d for d in doses if d.scheduled_time >= week_start]
    taken = sum(1 for d in week_doses if d.status == "taken")
    missed = sum(1 for d in week_doses if d.status == "missed")
    counted = taken + missed
    week_adherence = round((taken / counted) * 100) if counted > 0 else None

    return {"week_adherence": week_adherence, "history": history}


@router.patch("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: str,
    data: PatientCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    patient = await get_owned_patient(patient_id, current_user, db)

    validate_name(data.full_name)
    validate_phone(data.phone)

    patient.full_name = data.full_name
    patient.phone = data.phone
    patient.family_phone = data.family_phone
    patient.doctor_phone = data.doctor_phone
    patient.age = data.age
    patient.language = data.language

    await db.commit()
    await db.refresh(patient)
    return PatientResponse.model_validate(patient)


@router.delete("/{patient_id}")
async def delete_patient(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    patient = await get_owned_patient(patient_id, current_user, db)
    patient.is_active = False
    await db.commit()
    return {"message": "Patient deactivated successfully"}


@router.post("/{patient_id}/regenerate-invite", response_model=PatientResponse)
async def regenerate_invite_code(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    patient = await get_owned_patient(patient_id, current_user, db)
    patient.invite_code = await generate_unique_invite_code(db)
    await db.commit()
    await db.refresh(patient)
    return PatientResponse.model_validate(patient)

