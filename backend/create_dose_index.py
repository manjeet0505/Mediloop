import asyncio
from dotenv import load_dotenv
load_dotenv(override=True)

from sqlalchemy import text
from app.database.connection import engine

async def main():
    async with engine.begin() as conn:
        await conn.execute(text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_dose_slot "
            "ON dose_events (patient_id, medicine_name, scheduled_time)"
        ))
    print("Index ready.")

asyncio.run(main())