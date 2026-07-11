import asyncio
from sqlalchemy import select
from app.database.connection import AsyncSessionLocal
from app.database.models import Patient

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Patient).where(Patient.invite_code == "3DY7BV"))
        p = result.scalar_one_or_none()
        if p:
            print(p.full_name, p.user_id)
        else:
            print("Not found")

asyncio.run(main())