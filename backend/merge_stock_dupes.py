import asyncio
import sys
from collections import defaultdict
from dotenv import load_dotenv
load_dotenv(override=True)

from sqlalchemy import select, func
from app.database.connection import AsyncSessionLocal
from app.database.models import StockLevel, DoseEvent

APPLY = "--apply" in sys.argv

async def main():
    async with AsyncSessionLocal() as db:
        stocks = (await db.execute(select(StockLevel))).scalars().all()

        groups = defaultdict(list)
        for s in stocks:
            groups[(s.patient_id, s.medicine_name.strip().lower())].append(s)

        plan = []
        for (pid, name), rows in groups.items():
            if len(rows) < 2:
                continue
            # Keep the NEWEST row (latest prescription)
            rows.sort(key=lambda r: r.start_date)
            keep, drop = rows[-1], rows[:-1]

            # Recalculate taken from real dose events since the kept row's start
            taken_since = (await db.execute(
                select(func.count(DoseEvent.id)).where(
                    DoseEvent.patient_id == pid,
                    DoseEvent.medicine_name.ilike(name),
                    DoseEvent.status == "taken",
                )
            )).scalar_one()

            plan.append((name, pid, keep, drop, taken_since))

        for name, pid, keep, drop, taken_since in plan:
            print(f"\n{name} (patient {pid[:8]})")
            print(f"  KEEP id={keep.id[:8]} taken {keep.doses_taken} -> {taken_since}")
            for d in drop:
                print(f"  DELETE id={d.id[:8]} taken={d.doses_taken} total={d.total_quantity}")

        if not APPLY:
            print("\nDry run. Kuch change nahi hua. Apply ke liye: python merge_stock_dupes.py --apply")
            return

        for name, pid, keep, drop, taken_since in plan:
            for d in drop:
                await db.delete(d)
            keep.doses_taken = taken_since
        await db.commit()
        print(f"\nApplied. Merged {len(plan)} medicine(s).")

asyncio.run(main())