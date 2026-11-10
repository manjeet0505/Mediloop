import asyncio
from dotenv import load_dotenv
load_dotenv(override=True)

from sqlalchemy import select, update
from app.database.connection import AsyncSessionLocal
from app.database.models import Patient

PATIENT_ID = "c7e37730-70b2-4a82-aa5e-5d049861d890"

async def main():
    async with AsyncSessionLocal() as db:
        p = (await db.execute(select(Patient).where(Patient.id == PATIENT_ID))).scalar_one()
        print("Current level:", p.escalation_level)
        await db.execute(update(Patient).where(Patient.id == PATIENT_ID).values(escalation_level="normal"))
        await db.commit()
        print("Reset done -> normal")

asyncio.run(main())