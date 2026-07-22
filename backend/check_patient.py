import asyncio
from sqlalchemy import select
from app.database.connection import async_session
from app.database.models import Patient, User

async def main():
    async with async_session() as db:
        result = await db.execute(select(Patient).where(Patient.full_name.ilike("%steve%")))
        patients = result.scalars().all()

        if not patients:
            print("Koi bhi 'Steve' naam ka patient nahi mila DB mein.")
            return

        for p in patients:
            print(f"\nPatient: {p.full_name}")
            print(f"  Patient ID: {p.id}")
            print(f"  Clinic ID:  {p.clinic_id}")
            print(f"  User ID (patient's own login):  {p.user_id}")

            clinic_result = await db.execute(select(User).where(User.id == p.clinic_id))
            clinic = clinic_result.scalar_one_or_none()
            if clinic:
                print(f"  Clinic email: {clinic.email}")

asyncio.run(main())