import asyncio
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
load_dotenv(override=True)

from sqlalchemy import select
from app.database.connection import AsyncSessionLocal
from app.database.models import DoseEvent, Patient
from app.services.dose_service import process_missed_doses_and_escalate

PATIENT_ID = "c7e37730-70b2-4a82-aa5e-5d049861d890"  # Test Patient only

async def main():
    async with AsyncSessionLocal() as db:
        p = (await db.execute(select(Patient).where(Patient.id == PATIENT_ID))).scalar_one()
        print("Before:", p.escalation_level, "| family_phone:", p.family_phone, "| doctor_phone:", p.doctor_phone)

        # Make 4 pending doses look 3 hours overdue (so they count as missed)
        pending = (await db.execute(
            select(DoseEvent).where(DoseEvent.patient_id == PATIENT_ID, DoseEvent.status == "pending")
            .order_by(DoseEvent.scheduled_time).limit(4)
        )).scalars().all()
        for d in pending:
            d.scheduled_time = datetime.now(timezone.utc) - timedelta(hours=3)
        await db.commit()
        print("Shifted", len(pending), "pending doses to 3h ago")

    async with AsyncSessionLocal() as db:
        marked = await process_missed_doses_and_escalate(db)
        print("Marked missed:", marked)
        p = (await db.execute(select(Patient).where(Patient.id == PATIENT_ID))).scalar_one()
        print("After:", p.escalation_level)

asyncio.run(main())