from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone
from app.database.connection import get_db
from app.database.models import User, Patient, DoseEvent, StockLevel
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
    """
    Clinic-wide stock view — every medicine across every active patient,
    sorted by urgency (fewest days remaining first).
    """
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

    output = []
    for s in stocks:
        remaining = max(s.total_quantity - s.doses_taken, 0)
        days_left = remaining // s.doses_per_day if s.doses_per_day > 0 else remaining
        output.append({
            "patient_id": s.patient_id,
            "patient_name": patient_map.get(s.patient_id, "Unknown"),
            "medicine_name": s.medicine_name,
            "dosage": s.dosage or "",
            "remaining": remaining,
            "total": s.total_quantity,
            "days_left": days_left,
            "color": color_for(s.medicine_name),
        })

    output.sort(key=lambda x: x["days_left"])
    return output


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