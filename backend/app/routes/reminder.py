from fastapi import APIRouter
from app.agents.reminder_agent import (
    schedule_patient_reminders,
    confirm_dose_taken,
    get_adherence_stats,
    send_dose_reminder,
    active_schedules
)
from app.models.reminder import ReminderSchedule, DoseConfirmation
from app.database.connection import get_db
from app.database.models import Patient
from app.services.dose_service import send_whatsapp_message
from sqlalchemy import select
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
router = APIRouter(prefix="/api/v1/reminder", tags=["Reminder Agent"])

# schedule
@router.post("/schedule")
async def schedule_reminders(schedule: ReminderSchedule):
    """
    Agent 2 - Schedule medication reminders for a patient
    """
    result = schedule_patient_reminders(schedule)
    return {"success": True, "data": result}

@router.post("/confirm-dose")
async def confirm_dose(confirmation: DoseConfirmation):
    """
    Patient confirms dose taken - simulates WhatsApp reply '1'
    """
    success = confirm_dose_taken(
        confirmation.patient_id,
        confirmation.medicine_name
    )
    return {
        "success": success,
        "message": "Dose confirmed!" if success else "No pending dose found"
    }

@router.get("/adherence/{patient_id}")
async def get_adherence(patient_id: str):
    """
    Get adherence stats for a patient
    """
    stats = get_adherence_stats(patient_id)
    return {"success": True, "data": stats}

@router.post("/test-reminder/{patient_id}")
async def test_reminder(patient_id: str, medicine_name: str, dosage: str, db: AsyncSession = Depends(get_db)):
    """
    Trigger a test reminder immediately - for demo purposes.
    Fetches the real patient from DB (bypasses in-memory active_schedules).
    """
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        return {"success": False, "message": "Patient not found"}

    msg = f"💊 Medicine Reminder: Time to take {medicine_name} ({dosage}). Reply 1 to confirm."
    sent = send_whatsapp_message(patient.phone, msg)

    return {"success": sent, "message": f"Reminder {'sent' if sent else 'failed'} for {medicine_name}"}

@router.get("/active-schedules")
async def get_active_schedules():
    """
    Get all active patient schedules
    """
    return {
        "success": True,
        "total_patients": len(active_schedules),
        "patients": list(active_schedules.keys())
    }