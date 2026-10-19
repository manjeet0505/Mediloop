import asyncio
import sys
from collections import defaultdict
from datetime import datetime, timezone
from dotenv import load_dotenv
load_dotenv(override=True)

from sqlalchemy import select, delete
from app.database.connection import AsyncSessionLocal
from app.database.models import DoseEvent

APPLY = "--apply" in sys.argv
# Keep the strongest row: taken > pending > missed, then the oldest one
PRIORITY = {"taken": 0, "pending": 1, "missed": 2}
EPOCH = datetime.min.replace(tzinfo=timezone.utc)

async def main():
    async with AsyncSessionLocal() as db:
        rows = (await db.execute(select(DoseEvent))).scalars().all()

        groups = defaultdict(list)
        for r in rows:
            key = (r.patient_id, r.medicine_name.strip().lower(), r.scheduled_time)
            groups[key].append(r)

        to_delete, kept_taken_twice = [], 0
        for items in groups.values():
            if len(items) < 2:
                continue
            items.sort(key=lambda r: (
                PRIORITY.get(r.status, 9),
                r.created_at or EPOCH,
            ))
            if sum(1 for r in items if r.status == "taken") > 1:
                kept_taken_twice += 1
            to_delete += [r.id for r in items[1:]]

        print(f"Rows to delete: {len(to_delete)}")
        print(f"Slots where 2 rows were both 'taken': {kept_taken_twice}")

        if not APPLY:
            print("Dry run. Kuch delete nahi hua. Asli delete ke liye: python cleanup_dose_dupes.py --apply")
            return

        await db.execute(delete(DoseEvent).where(DoseEvent.id.in_(to_delete)))
        await db.commit()
        print(f"Deleted {len(to_delete)} rows.")

asyncio.run(main())