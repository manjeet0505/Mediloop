import asyncio
from datetime import date, datetime, timezone
from dotenv import load_dotenv
load_dotenv(override=True)

from sqlalchemy import select
from app.database.connection import AsyncSessionLocal
from app.database.models import DoseEvent

async def main():
    start = datetime.combine(date.today(), datetime.min.time(), tzinfo=timezone.utc)
    async with AsyncSessionLocal() as db:
        rows = (await db.execute(
            select(DoseEvent).where(DoseEvent.scheduled_time >= start)
            .order_by(DoseEvent.scheduled_time)
        )).scalars().all()
    for r in rows:
        print(f"{r.scheduled_time.strftime('%H:%M')} UTC | {r.medicine_name:15} | {r.status}")
    print(f"\nTotal today: {len(rows)}")

asyncio.run(main())