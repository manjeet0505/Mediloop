from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.connection import get_db
from app.database.models import User, Patient
from app.database.schemas import PatientCreate, PatientResponse
from app.utils.auth import get_current_user
from app.utils.validators import validate_phone, validate_name
import uuid
import random
import string

router = APIRouter(prefix="/api/v1/patients", tags=["Patient Management"])

# Excludes confusing chars: 0/O, 1/I/L
INVITE_CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"

async def generate_unique_invite_code(db: AsyncSession) -> str:
    """Generate a 6-character invite code, retrying on collision."""
    for _ in range(10):
        code = "".join(random.choices(INVITE_CODE_CHARS, k=6))
        result = await db.execute(select(Patient).where(Patient.invite_code == code))
        if not result.scalar_one_or_none():
            return code
    raise HTTPException(status_code=500, detail="Could not generate unique invite code, try again")

@router.post("/", response_model=PatientResponse)
async def create_patient(
    data: PatientCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new patient under the logged-in clinic"""
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
    """List all patients belonging to the logged-in clinic"""
    result = await db.execute(
        select(Patient).where(Patient.clinic_id == current_user.id).order_by(Patient.created_at.desc())
    )
    patients = result.scalars().all()
    return [PatientResponse.model_validate(p) for p in patients]

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific patient — only if it belongs to the logged-in clinic"""
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.clinic_id == current_user.id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return PatientResponse.model_validate(patient)

@router.patch("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: str,
    data: PatientCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a patient's details"""
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.clinic_id == current_user.id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

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
    """Soft-delete a patient (deactivate)"""
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.clinic_id == current_user.id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient.is_active = False
    await db.commit()
    return {"message": "Patient deactivated successfully"}

@router.post("/{patient_id}/regenerate-invite", response_model=PatientResponse)
async def regenerate_invite_code(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate a fresh invite code for a patient (e.g. if the old one expired or was shared by mistake)"""
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.clinic_id == current_user.id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient.invite_code = await generate_unique_invite_code(db)
    await db.commit()
    await db.refresh(patient)
    return PatientResponse.model_validate(patient)