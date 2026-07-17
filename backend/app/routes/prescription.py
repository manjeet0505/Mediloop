import re
import json
import uuid
from datetime import datetime, timedelta, timezone, date
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.agents.prescription_agent import process_prescription, parse_with_openai
from app.models.prescription import PrescriptionResponse, ConfirmPrescriptionRequest
from app.database.connection import get_db
from app.database.models import User, Patient, Prescription, DoseEvent, StockLevel
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/v1/prescription", tags=["Prescription Agent"])

# times_per_day -> default clock times, same convention used across the app
DOSE_TIMES = {
    1: ["09:00"],
    2: ["09:00", "21:00"],
    3: ["08:00", "14:00", "20:00"],
    4: ["08:00", "13:00", "18:00", "22:00"],
}


def parse_duration_days(duration_str: str) -> int:
    """'7 days' -> 7, '2 weeks' -> 14, '1 month' -> 30. Falls back to 30 if unparseable."""
    if not duration_str:
        return 30
    match = re.search(r"(\d+)", duration_str)
    if not match:
        return 30
    n = int(match.group(1))
    lower = duration_str.lower()
    if "week" in lower:
        return n * 7
    if "month" in lower:
        return n * 30
    return n


async def get_owned_patient(patient_id: str, current_user: User, db: AsyncSession) -> Patient:
    if current_user.role != "clinic":
        raise HTTPException(status_code=403, detail="Clinic access only")
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.clinic_id == current_user.id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.post("/parse", response_model=PrescriptionResponse)
async def parse_prescription(
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Agent 1 — upload a prescription image, get back a structured, EDITABLE
    care plan. Nothing is saved yet — call /confirm to persist after review.
    """
    await get_owned_patient(patient_id, current_user, db)  # ownership check, raises if invalid

    allowed_types = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPG, PNG images supported")

    image_bytes = await file.read()
    result = await process_prescription(image_bytes, file.content_type)
    return result


@router.post("/parse-text")
async def parse_prescription_text(text: str):
    """Test Agent 1 with raw text directly — no image, no auth, dev convenience only."""
    try:
        result = await parse_with_openai(text)
        return {"success": True, "result": result, "llm_used": "openai"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/confirm")
async def confirm_prescription(
    data: ConfirmPrescriptionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Persists a reviewed/edited care plan:
      - Prescription record (structured JSON, so it can be listed/rendered later)
      - Today's DoseEvent rows per medicine (the scheduler carries the pattern forward daily)
      - StockLevel upsert per medicine (duration x frequency = total quantity)
    """
    patient = await get_owned_patient(data.patient_id, current_user, db)

    if not data.medications:
        raise HTTPException(status_code=400, detail="At least one medication is required")

    # 1) Prescription audit record — store medications as structured JSON
    medications_json = json.dumps([m.model_dump() for m in data.medications])
    prescription = Prescription(
        id=str(uuid.uuid4()),
        patient_id=patient.id,
        doctor_name=data.doctor_name,
        raw_text=data.raw_text,
        care_plan=medications_json,
        safety_flag=data.safety_flag,
        safety_note=data.safety_note,
        llm_used="openai-vision",
    )
    db.add(prescription)

    today_start = datetime.combine(date.today(), datetime.min.time(), tzinfo=timezone.utc)
    created_doses = 0

    for med in data.medications:
        times_per_day = max(1, min(med.times_per_day, 4))
        clock_times = DOSE_TIMES.get(times_per_day, DOSE_TIMES[1])
        duration_days = parse_duration_days(med.duration)

        for time_str in clock_times:
            hour, minute = map(int, time_str.split(":"))
            scheduled = today_start.replace(hour=hour, minute=minute)

            existing = await db.execute(
                select(DoseEvent).where(
                    DoseEvent.patient_id == patient.id,
                    DoseEvent.medicine_name == med.medicine_name,
                    DoseEvent.scheduled_time == scheduled,
                )
            )
            if existing.scalar_one_or_none():
                continue

            db.add(DoseEvent(
                id=str(uuid.uuid4()),
                patient_id=patient.id,
                medicine_name=med.medicine_name,
                dosage=med.dosage,
                scheduled_time=scheduled,
                status="pending",
            ))
            created_doses += 1

        result = await db.execute(
            select(StockLevel).where(
                StockLevel.patient_id == patient.id,
                StockLevel.medicine_name == med.medicine_name,
            )
        )
        stock = result.scalar_one_or_none()
        total_quantity = duration_days * times_per_day

        if stock:
            stock.total_quantity = total_quantity
            stock.doses_taken = 0
            stock.doses_per_day = times_per_day
            stock.dosage = med.dosage
        else:
            db.add(StockLevel(
                id=str(uuid.uuid4()),
                patient_id=patient.id,
                medicine_name=med.medicine_name,
                dosage=med.dosage,
                total_quantity=total_quantity,
                doses_taken=0,
                doses_per_day=times_per_day,
            ))

    await db.commit()
    await db.refresh(prescription)

    return {
        "success": True,
        "prescription_id": prescription.id,
        "medications_saved": len(data.medications),
        "doses_created_today": created_doses,
    }


@router.get("/patient/{patient_id}")
async def list_prescriptions(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Prescription history for a patient, newest first — for the Prescriptions tab."""
    await get_owned_patient(patient_id, current_user, db)

    result = await db.execute(
        select(Prescription)
        .where(Prescription.patient_id == patient_id)
        .order_by(Prescription.created_at.desc())
    )
    prescriptions = result.scalars().all()

    output = []
    for p in prescriptions:
        try:
            medications = json.loads(p.care_plan) if p.care_plan else []
        except (json.JSONDecodeError, TypeError):
            medications = []  # legacy plain-text rows from before this change

        output.append({
            "id": p.id,
            "doctor_name": p.doctor_name,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "safety_flag": p.safety_flag,
            "safety_note": p.safety_note,
            "medications": medications,
        })

    return output