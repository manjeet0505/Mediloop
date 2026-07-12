import asyncio
import uuid
from datetime import datetime, timedelta, timezone, date
from sqlalchemy import select
from app.database.connection import AsyncSessionLocal
from app.database.models import Patient, DoseEvent, StockLevel

INVITE_CODE = "3DY7BV"  # change this if your test patient's code is different


async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Patient).where(Patient.invite_code == INVITE_CODE))
        patient = result.scalar_one_or_none()

        if not patient:
            print(f"No patient found with invite code {INVITE_CODE}")
            return
        if not patient.user_id:
            print("This patient isn't linked to a login yet — signup with the invite code first.")
            return

        print(f"Seeding data for: {patient.full_name} ({patient.id})")

        today = date.today()

        # ── Today's doses (some taken, some pending) ──
        dose_defs = [
            ("Metformin", "500mg", 9, 0, "taken"),
            ("Metformin", "500mg", 21, 0, "pending"),
            ("Amlodipine", "5mg", 9, 0, "pending"),
        ]
        for name, dosage, hour, minute, status in dose_defs:
            scheduled = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc).replace(hour=hour, minute=minute)
            db.add(DoseEvent(
                id=str(uuid.uuid4()),
                patient_id=patient.id,
                medicine_name=name,
                dosage=dosage,
                scheduled_time=scheduled,
                status=status,
                taken_at=scheduled if status == "taken" else None,
            ))

        # ── Past 6 days of history (for adherence/week chart/streak) ──
        history_pattern = [
            (1, ["taken", "taken"]),      # yesterday: both taken
            (2, ["taken", "missed"]),
            (3, ["taken", "taken"]),
            (4, ["missed", "missed"]),
            (5, ["taken", "taken"]),
            (6, ["taken", "taken"]),
        ]
        for days_ago, statuses in history_pattern:
            day = today - timedelta(days=days_ago)
            for i, status in enumerate(statuses):
                hour = 9 if i == 0 else 21
                scheduled = datetime.combine(day, datetime.min.time(), tzinfo=timezone.utc).replace(hour=hour)
                db.add(DoseEvent(
                    id=str(uuid.uuid4()),
                    patient_id=patient.id,
                    medicine_name="Metformin",
                    dosage="500mg",
                    scheduled_time=scheduled,
                    status=status,
                    taken_at=scheduled if status == "taken" else None,
                ))

        # ── Stock levels ──
        db.add(StockLevel(
            id=str(uuid.uuid4()),
            patient_id=patient.id,
            medicine_name="Metformin",
            dosage="500mg",
            total_quantity=60,
            doses_taken=50,
            doses_per_day=2,
        ))
        db.add(StockLevel(
            id=str(uuid.uuid4()),
            patient_id=patient.id,
            medicine_name="Amlodipine",
            dosage="5mg",
            total_quantity=60,
            doses_taken=15,
            doses_per_day=1,
        ))

        await db.commit()
        print("Seed data inserted successfully.")


asyncio.run(main())