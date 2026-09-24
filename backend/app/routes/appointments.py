from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from typing import Optional

from app.database.connection import get_db
from app.database.models import User, Patient, Appointment
from app.utils.auth import get_current_user
from app.routes.patient import get_linked_patient
from app.routes.vitals import get_clinic_owned_patient
from app.services.google_calendar_service import (
    create_calendar_event,
    update_calendar_event,
    delete_calendar_event,
)

router = APIRouter(prefix="/api/v1", tags=["appointments"])


# ── Clinic-side: create / list / update / cancel ────────────────────

@router.post("/patients/{patient_id}/appointments")
async def create_appointment(
    patient_id: str,
    scheduled_at: datetime,
    doctor_name: Optional[str] = None,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    patient = await get_clinic_owned_patient(patient_id, current_user, db)

    appointment = Appointment(
        patient_id=patient.id,
        doctor_name=doctor_name,
        scheduled_at=scheduled_at,
        notes=notes,
        status="scheduled",
    )
    db.add(appointment)
    await db.commit()
    await db.refresh(appointment)

    # Best-effort calendar sync — appointment is already saved even if this fails
    try:
        event_id = await create_calendar_event(patient.clinic_id, appointment, patient, db)
        if event_id:
            appointment.google_event_id = event_id
            await db.commit()
            await db.refresh(appointment)
    except Exception as e:
        print(f"⚠️  Calendar sync failed on create: {e}")

    return {
        "id": appointment.id,
        "doctor_name": appointment.doctor_name,
        "scheduled_at": appointment.scheduled_at.isoformat(),
        "status": appointment.status,
        "notes": appointment.notes,
        "google_synced": appointment.google_event_id is not None,
    }


@router.get("/patients/{patient_id}/appointments")
async def list_appointments(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_clinic_owned_patient(patient_id, current_user, db)

    result = await db.execute(
        select(Appointment)
        .where(Appointment.patient_id == patient_id)
        .order_by(Appointment.scheduled_at.desc())
    )
    appointments = result.scalars().all()

    return [
        {
            "id": a.id,
            "doctor_name": a.doctor_name,
            "scheduled_at": a.scheduled_at.isoformat(),
            "status": a.status,
            "notes": a.notes,
            "google_synced": a.google_event_id is not None,
            "pre_visit_brief": a.pre_visit_brief,
        }
        for a in appointments
    ]


async def get_appointment_or_404(appointment_id: str, db: AsyncSession) -> Appointment:
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


@router.patch("/appointments/{appointment_id}")
async def update_appointment(
    appointment_id: str,
    scheduled_at: Optional[datetime] = None,
    doctor_name: Optional[str] = None,
    notes: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    appointment = await get_appointment_or_404(appointment_id, db)
    patient = await get_clinic_owned_patient(appointment.patient_id, current_user, db)

    if scheduled_at is not None:
        appointment.scheduled_at = scheduled_at
    if doctor_name is not None:
        appointment.doctor_name = doctor_name
    if notes is not None:
        appointment.notes = notes
    if status is not None:
        if status not in ("scheduled", "completed", "cancelled", "missed"):
            raise HTTPException(status_code=400, detail="Invalid status")
        appointment.status = status

    await db.commit()
    await db.refresh(appointment)

    try:
        await update_calendar_event(patient.clinic_id, appointment, patient, db)
    except Exception as e:
        print(f"⚠️  Calendar sync failed on update: {e}")

    return {
        "id": appointment.id,
        "doctor_name": appointment.doctor_name,
        "scheduled_at": appointment.scheduled_at.isoformat(),
        "status": appointment.status,
        "notes": appointment.notes,
    }


@router.delete("/appointments/{appointment_id}")
async def cancel_appointment(
    appointment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    appointment = await get_appointment_or_404(appointment_id, db)
    patient = await get_clinic_owned_patient(appointment.patient_id, current_user, db)

    try:
        if appointment.google_event_id:
            await delete_calendar_event(patient.clinic_id, appointment.google_event_id, db)
    except Exception as e:
        print(f"⚠️  Calendar sync failed on cancel: {e}")

    appointment.status = "cancelled"
    await db.commit()

    return {"cancelled": True, "id": appointment.id}


# ── Patient-side: view next appointment ─────────────────────────────

@router.get("/patient/me/appointment")
async def get_my_next_appointment(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    patient = await get_linked_patient(current_user, db)

    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Appointment)
        .where(
            Appointment.patient_id == patient.id,
            Appointment.status == "scheduled",
            Appointment.scheduled_at >= now,
        )
        .order_by(Appointment.scheduled_at.asc())
        .limit(1)
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        return None

    return {
        "id": appointment.id,
        "doctor_name": appointment.doctor_name or "Doctor",
        "scheduled_at": appointment.scheduled_at.isoformat(),
    }