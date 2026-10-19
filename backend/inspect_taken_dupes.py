import asyncio
from collections import defaultdict
from dotenv import load_dotenv
load_dotenv(override=True)

from sqlalchemy import select
from app.database.connection import AsyncSessionLocal
from app.database.models import DoseEvent

async def main():
    async with AsyncSessionLocal() as db:
        rows = (await db.execute(select(DoseEvent))).scalars().all()

    groups = defaultdict(list)
    for r in rows:
        groups[(r.patient_id, r.medicine_name.strip().lower(), r.scheduled_time)].append(r)

    n = 0
    for (pid, name, t), items in sorted(groups.items(), key=lambda x: x[0][2]):
        if sum(1 for r in items if r.status == "taken") > 1:
            n += 1
            print(f"\n{name} @ {t.isoformat()} (patient {pid[:8]})")
            for r in sorted(items, key=lambda r: r.created_at):
                print(f"  id={r.id[:8]} status={r.status} created={r.created_at} taken_at={r.taken_at}")
    print(f"\nTotal slots: {n}")

asyncio.run(main())