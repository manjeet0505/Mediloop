from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone
from typing import Optional

from app.services.dose_service import send_vital_alert
from app.database.connection import get_db
from app.database.models import User, Patient, VitalReading
from app.utils.auth import get_current_user
from app.services.clinical_thresholds import evaluate_vital
from app.routes.patient import get_linked_patient 
from app.services.trend_service import check_and_alert_trend

router = APIRouter(prefix="/api/v1", tags=["vitals"])

VALID_VITAL_TYPES = {"bp", "blood_sugar", "weight", "spo2", "heart_rate"}

VITAL_UNITS = {
    "bp": "mmHg",
    "blood_sugar": "mg/dL",
    "weight": "kg",
    "spo2": "%",
    "heart_rate": "bpm",
}


# ── Patient-side: log + view own vitals ─────────────────────────────

@router.post("/patient/me/vitals")
async def log_vital(
    vital_type: str,
    value_1: float,
    value_2: Optional[float] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if vital_type not in VALID_VITAL_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid vital_type. Must be one of {VALID_VITAL_TYPES}")

    patient = await get_linked_patient(current_user, db)
    status = evaluate_vital(vital_type, value_1, value_2)

    reading = VitalReading(
        patient_id=patient.id,
        vital_type=vital_type,
        value_1=value_1,
        value_2=value_2,
        unit=VITAL_UNITS[vital_type],
        recorded_at=datetime.now(timezone.utc),
        source="manual",
        status=status,
    )
    db.add(reading)
    await db.commit()
    await db.refresh(reading)

    db.add(reading)
    await db.commit()
    await db.refresh(reading)

    if status == "critical":
        send_vital_alert(patient, vital_type, value_1, value_2, VITAL_UNITS[vital_type])

    await check_and_alert_trend(patient, vital_type, db)

    return {
        "id": reading.id,
        "vital_type": reading.vital_type,
        "value_1": reading.value_1,
        "value_2": reading.value_2,
        "unit": reading.unit,
        "status": reading.status,
        "recorded_at": reading.recorded_at.isoformat(),
    }


@router.get("/patient/me/vitals")
async def get_my_vitals(
    vital_type: Optional[str] = None,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    patient = await get_linked_patient(current_user, db)

    window_start = datetime.now(timezone.utc) - timedelta(days=days)
    query = select(VitalReading).where(
        VitalReading.patient_id == patient.id,
        VitalReading.recorded_at >= window_start,
    )
    if vital_type:
        if vital_type not in VALID_VITAL_TYPES:
            raise HTTPException(status_code=400, detail=f"Invalid vital_type. Must be one of {VALID_VITAL_TYPES}")
        query = query.where(VitalReading.vital_type == vital_type)

    query = query.order_by(VitalReading.recorded_at.desc())
    result = await db.execute(query)
    readings = result.scalars().all()

    return [
        {
            "id": r.id,
            "vital_type": r.vital_type,
            "value_1": r.value_1,
            "value_2": r.value_2,
            "unit": r.unit,
            "status": r.status,
            "recorded_at": r.recorded_at.isoformat(),
        }
        for r in readings
    ]


# ── Clinic-side: view a specific patient's vitals ───────────────────
# ASSUMPTION: clinic ownership check mirrors patients.py pattern.
# Paste patients.py's equivalent endpoint if this doesn't match.

async def get_clinic_owned_patient(patient_id: str, current_user: User, db: AsyncSession) -> Patient:
    if current_user.role not in ("clinic", "doctor"):
        raise HTTPException(status_code=403, detail="Clinic/doctor access only")

    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if patient.clinic_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your patient")
    return patient


@router.get("/patients/{patient_id}/vitals/latest")
async def get_patient_latest_vitals(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_clinic_owned_patient(patient_id, current_user, db)

    latest_by_type = {}
    for vtype in VALID_VITAL_TYPES:
        result = await db.execute(
            select(VitalReading)
            .where(VitalReading.patient_id == patient_id, VitalReading.vital_type == vtype)
            .order_by(VitalReading.recorded_at.desc())
            .limit(1)
        )
        reading = result.scalar_one_or_none()
        if reading:
            latest_by_type[vtype] = {
                "value_1": reading.value_1,
                "value_2": reading.value_2,
                "unit": reading.unit,
                "status": reading.status,
                "recorded_at": reading.recorded_at.isoformat(),
            }

    return latest_by_type


@router.get("/patients/{patient_id}/vitals/trend")
async def get_patient_vital_trend(
    patient_id: str,
    vital_type: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if vital_type not in VALID_VITAL_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid vital_type. Must be one of {VALID_VITAL_TYPES}")

    await get_clinic_owned_patient(patient_id, current_user, db)

    result = await db.execute(
        select(VitalReading)
        .where(VitalReading.patient_id == patient_id, VitalReading.vital_type == vital_type)
        .order_by(VitalReading.recorded_at.desc())
        .limit(5)
    )
    readings = result.scalars().all()

    return [
        {
            "value_1": r.value_1,
            "value_2": r.value_2,
            "status": r.status,
            "recorded_at": r.recorded_at.isoformat(),
        }
        for r in reversed(readings)  # oldest → newest for charting
    ]