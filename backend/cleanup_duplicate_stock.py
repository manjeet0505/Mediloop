import asyncio
from sqlalchemy import select
from app.database.connection import AsyncSessionLocal
from app.database.models import Patient, StockLevel

INVITE_CODE = "3DY7BV"  # your Test Patient's invite code


async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Patient).where(Patient.invite_code == INVITE_CODE))
        patient = result.scalar_one_or_none()
        if not patient:
            print("Patient not found")
            return

        result = await db.execute(
            select(StockLevel).where(StockLevel.patient_id == patient.id).order_by(StockLevel.start_date)
        )
        stocks = result.scalars().all()

        seen = set()
        to_delete = []
        for s in stocks:
            if s.medicine_name in seen:
                to_delete.append(s)
            else:
                seen.add(s.medicine_name)

        print(f"Found {len(stocks)} stock rows, {len(to_delete)} duplicates to remove")

        for s in to_delete:
            await db.delete(s)

        await db.commit()
        print(f"Cleaned up. {len(seen)} unique medicines remain: {', '.join(seen)}")


asyncio.run(main())