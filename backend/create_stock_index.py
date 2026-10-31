import asyncio
from dotenv import load_dotenv
load_dotenv(override=True)

from sqlalchemy import text
from app.database.connection import engine

async def main():
    async with engine.begin() as conn:
        await conn.execute(text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_med "
            "ON stock_levels (patient_id, lower(trim(medicine_name)))"
        ))
    print("Stock index ready.")

asyncio.run(main())