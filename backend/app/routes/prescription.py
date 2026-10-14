import re
import json
import uuid
from datetime import datetime, timedelta, timezone, date
import asyncio
import logging
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.agents.prescription_agent import process_prescription, parse_with_openai, answer_history_question
from app.services.interaction_service import evaluate_new_medicines
from app.services.rag_service import index_prescription, search_patient_history
from app.models.prescription import PrescriptionResponse, ConfirmPrescriptionRequest
from app.database.connection import get_db
from app.database.models import User, Patient, Prescription, DoseEvent, StockLevel
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/v1/prescription", tags=["Prescription Agent"])
logger = logging.getLogger("prescription_routes")

DOSE_TIMES = {
    1: ["09:00"],
    2: ["09:00", "21:00"],
    3: ["08:00", "14:00", "20:00"],
    4: ["08:00", "13:00", "18:00", "22:00"],
}


def parse_duration_days(duration_str: str) -> int:
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

async def _index_in_background(patient_id, prescription_id, doctor_name, medications, raw_text, created_at):
    try:
        await index_prescription(
            patient_id=patient_id,
            prescription_id=prescription_id,
            doctor_name=doctor_name,
            medications=medications,
            raw_text=raw_text,
            created_at=created_at,
        )
    except Exception as e:
        logger.warning("Could not index prescription %s into Qdrant: %s", prescription_id, e)

@router.post("/parse", response_model=PrescriptionResponse)
async def parse_prescription(
    file: UploadFile = File(...),
    patient_id: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_owned_patient(patient_id, current_user, db)

    allowed_types = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPG, PNG images supported")

    image_bytes = await file.read()
    result = await process_prescription(image_bytes, file.content_type)

    # Check the newly parsed medicines against what the patient is already taking.
    # Never blocks the parse - it only adds to the safety note / flag for the doctor to review.
    if result.success and result.care_plan and result.care_plan.medications:
        stock_rows = await db.execute(select(StockLevel).where(StockLevel.patient_id == patient_id))
        existing_names = [
            s.medicine_name for s in stock_rows.scalars().all()
            if (s.total_quantity - s.doses_taken) > 0
        ]
        report = await evaluate_new_medicines(
            [m.medicine_name for m in result.care_plan.medications],
            existing_names,
        )
        care = result.care_plan
        if report["note"]:
            care.safety_note = f"{care.safety_note}\n{report['note']}" if care.safety_note else report["note"]
        if report["has_major"]:
            care.safety_flag = True

    return result


@router.post("/parse-text")
async def parse_prescription_text(text: str):
    try:
        result = await parse_with_openai(text)
        return {"success": True, "result": result, "llm_used": "openai"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/confirm")
async def confirm_prescription(
    data: ConfirmPrescriptionRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    patient = await get_owned_patient(data.patient_id, current_user, db)

    if not data.medications:
        raise HTTPException(status_code=400, detail="At least one medication is required")

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
            stock.reorder_alert_sent_at = None
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

    # Index for history search AFTER the commit, in the background - a failure here must never undo the save.
    background_tasks.add_task(
        _index_in_background,
        patient.id,
        prescription.id,
        data.doctor_name,
        [m.model_dump() for m in data.medications],
        data.raw_text,
        prescription.created_at,
    )

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
    """Prescription history for a single patient — for the patient detail tab."""
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
            medications = []

        output.append({
            "id": p.id,
            "doctor_name": p.doctor_name,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "safety_flag": p.safety_flag,
            "safety_note": p.safety_note,
            "medications": medications,
        })

    return output


@router.get("/clinic/all")
async def list_clinic_prescriptions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Prescription history across every patient in the clinic — newest first."""
    if current_user.role != "clinic":
        raise HTTPException(status_code=403, detail="Clinic access only")

    result = await db.execute(select(Patient).where(Patient.clinic_id == current_user.id))
    patients = result.scalars().all()
    patient_map = {p.id: p.full_name for p in patients}

    if not patient_map:
        return []

    result = await db.execute(
        select(Prescription)
        .where(Prescription.patient_id.in_(patient_map.keys()))
        .order_by(Prescription.created_at.desc())
    )
    prescriptions = result.scalars().all()

    output = []
    for p in prescriptions:
        try:
            medications = json.loads(p.care_plan) if p.care_plan else []
        except (json.JSONDecodeError, TypeError):
            medications = []

        output.append({
            "id": p.id,
            "patient_id": p.patient_id,
            "patient_name": patient_map.get(p.patient_id, "Unknown"),
            "doctor_name": p.doctor_name,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "safety_flag": p.safety_flag,
            "safety_note": p.safety_note,
            "medications": medications,
        })

    return output