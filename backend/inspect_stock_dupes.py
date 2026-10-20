import asyncio
from collections import defaultdict
from dotenv import load_dotenv
load_dotenv(override=True)

from sqlalchemy import select
from app.database.connection import AsyncSessionLocal
from app.database.models import StockLevel

async def main():
    async with AsyncSessionLocal() as db:
        rows = (await db.execute(select(StockLevel))).scalars().all()

    groups = defaultdict(list)
    for r in rows:
        groups[(r.patient_id, r.medicine_name.strip().lower())].append(r)

    for (pid, name), items in groups.items():
        if len(items) < 2:
            continue
        print(f"\n{name} (patient {pid[:8]})")
        for r in sorted(items, key=lambda r: r.start_date or 0):
            print(f"  id={r.id[:8]} name='{r.medicine_name}' total={r.total_quantity} "
                  f"taken={r.doses_taken} per_day={r.doses_per_day} "
                  f"start={r.start_date} updated={r.updated_at}")

asyncio.run(main())