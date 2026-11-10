import asyncio
from dotenv import load_dotenv
load_dotenv(override=True)
from sqlalchemy import update
from app.database.connection import AsyncSessionLocal
from app.database.models import Patient

async def main():
       async with AsyncSessionLocal() as db:
           await db.execute(update(Patient).where(Patient.id == "c7e37730-70b2-4a82-aa5e-5d049861d890").values(escalation_level="normal"))
           await db.commit()
           print("Reset to normal")

       asyncio.run(main())