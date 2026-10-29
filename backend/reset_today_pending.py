import asyncio
from dotenv import load_dotenv
load_dotenv(override=True)

from sqlalchemy import delete
from app.database.connection import AsyncSessionLocal
from app.database.models import DoseEvent
from app.services.dose_service import ist_today, ist_day_bounds_utc

async def main():
    start, end = ist_day_bounds_utc(ist_today())
    async with AsyncSessionLocal() as db:
        res = await db.execute(delete(DoseEvent).where(
            DoseEvent.scheduled_time >= start,
            DoseEvent.scheduled_time < end,
            DoseEvent.status == "pending",
            DoseEvent.taken_at.is_(None),
            DoseEvent.reminder_sent_at.is_(None),
        ))
        await db.commit()
        print("Deleted pending rows:", res.rowcount)

asyncio.run(main())