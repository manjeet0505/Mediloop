import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from app.database.connection import AsyncSessionLocal
from app.database.models import Patient, DoseEvent

INVITE_CODE = "3DY7BV"  # your Test Patient's invite code


async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Patient).where(Patient.invite_code == INVITE_CODE))
        patient = result.scalar_one_or_none()
        if not patient:
            print("Patient not found")
            return

        if not patient.family_phone:
            patient.family_phone = "+919876500000"
            print(f"Set family_phone to {patient.family_phone} for testing")

        print(f"Current escalation_level: {patient.escalation_level}")

        # 3 doses, each scheduled 3 hours ago (already overdue by 1hr past the 2hr missed threshold),
        # still status='pending' so job_check_missed will flip them to 'missed' on its next run.
        overdue_time = datetime.now(timezone.utc) - timedelta(hours=3)
        for i in range(3):
            dose = DoseEvent(
                id=str(uuid.uuid4()),
                patient_id=patient.id,
                medicine_name="Metformin",
                dosage="500mg",
                scheduled_time=overdue_time - timedelta(minutes=i * 5),
                status="pending",
            )
            db.add(dose)

        await db.commit()
        print("3 overdue pending doses created. Watch the server terminal for the next job_check_missed run (within 1 min).")


asyncio.run(main())