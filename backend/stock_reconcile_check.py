import asyncio
from collections import Counter
from dotenv import load_dotenv
load_dotenv(override=True)

from sqlalchemy import select
from app.database.connection import AsyncSessionLocal
from app.database.models import DoseEvent, StockLevel

async def main():
    async with AsyncSessionLocal() as db:
        doses = (await db.execute(select(DoseEvent).where(DoseEvent.status == "taken"))).scalars().all()
        stocks = (await db.execute(select(StockLevel))).scalars().all()

    taken = Counter((d.patient_id, d.medicine_name.strip().lower()) for d in doses)
    for s in stocks:
        key = (s.patient_id, s.medicine_name.strip().lower())
        flag = "" if s.doses_taken == taken[key] else "  <-- MISMATCH"
        print(f"{s.medicine_name:15} stock.doses_taken={s.doses_taken:3}  taken_doses={taken[key]:3}{flag}")

asyncio.run(main())