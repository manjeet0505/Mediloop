from fastapi import APIRouter, Depends
from app.database.connection import get_db
from app.database.models import Patient
from app.services.dose_service import send_whatsapp_message
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/v1/reminder", tags=["Reminder Agent"])


@router.post("/test-reminder/{patient_id}")
async def test_reminder(patient_id: str, medicine_name: str, dosage: str, db: AsyncSession = Depends(get_db)):
    """
    Trigger a test reminder immediately - for demo purposes.
    Fetches the real patient from DB.
    """
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        return {"success": False, "message": "Patient not found"}
    msg = f"💊 Medicine Reminder: Time to take {medicine_name} ({dosage}). Reply 1 to confirm."
    sent = send_whatsapp_message(patient.phone, msg)
    return {"success": sent, "message": f"Reminder {'sent' if sent else 'failed'} for {medicine_name}"}