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

        due_time = datetime.now(timezone.utc) + timedelta(minutes=1)
        dose = DoseEvent(
            id=str(uuid.uuid4()),
            patient_id=patient.id,
            medicine_name="Metformin",
            dosage="500mg",
            scheduled_time=due_time,
            status="pending",
        )
        db.add(dose)
        await db.commit()
        print(f"Test dose created — due at {due_time.strftime('%H:%M:%S')} UTC. Watch the server terminal.")


asyncio.run(main())