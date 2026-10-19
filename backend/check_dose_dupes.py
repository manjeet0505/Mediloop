import asyncio
from collections import Counter
from dotenv import load_dotenv
load_dotenv(override=True)

from sqlalchemy import select
from app.database.connection import AsyncSessionLocal
from app.database.models import DoseEvent

async def main():
    async with AsyncSessionLocal() as db:
        rows = (await db.execute(select(DoseEvent))).scalars().all()

    counts = Counter((r.patient_id, r.medicine_name.strip().lower(), r.scheduled_time) for r in rows)
    dups = {k: v for k, v in counts.items() if v > 1}

    print(f"Total doses: {len(rows)} | duplicate groups: {len(dups)}")
    for (pid, name, t), n in sorted(dups.items(), key=lambda x: x[0][2]):
        same_rows = [r for r in rows if r.patient_id == pid and r.medicine_name.strip().lower() == name and r.scheduled_time == t]
        created = sorted(r.created_at for r in same_rows)
        gap_ms = (created[-1] - created[0]).total_seconds() * 1000 if len(created) > 1 else 0
        print(f"{n}x {name} @ {t.isoformat()} | created within {gap_ms:.0f} ms")

asyncio.run(main())