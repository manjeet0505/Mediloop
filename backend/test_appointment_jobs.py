from dotenv import load_dotenv
load_dotenv(override=True)

import asyncio
from app.database.connection import AsyncSessionLocal
from app.services.appointment_service import (
    send_appointment_reminders_1d,
    send_appointment_reminders_2h,
    send_pre_visit_briefs,
)

async def main():
    async with AsyncSessionLocal() as db:
        r1 = await send_appointment_reminders_1d(db)
        print(f"1-day reminders sent: {r1}")

    async with AsyncSessionLocal() as db:
        r2 = await send_appointment_reminders_2h(db)
        print(f"2-hour reminders sent: {r2}")

    async with AsyncSessionLocal() as db:
        r3 = await send_pre_visit_briefs(db)
        print(f"Pre-visit briefs sent: {r3}")

asyncio.run(main())