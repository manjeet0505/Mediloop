import asyncio
import json
import os
from datetime import datetime
from dotenv import load_dotenv
load_dotenv(override=True)

from app.database.connection import AsyncSessionLocal, Base
import app.database.models  # registers all tables

async def main():
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_dir = f"backup_{stamp}"
    os.makedirs(out_dir, exist_ok=True)

    async with AsyncSessionLocal() as db:
        for table in Base.metadata.sorted_tables:
            result = await db.execute(table.select())
            rows = [dict(r._mapping) for r in result]
            path = os.path.join(out_dir, f"{table.name}.json")
            with open(path, "w", encoding="utf-8") as f:
                json.dump(rows, f, default=str, ensure_ascii=False, indent=2)
            print(f"{table.name}: {len(rows)} rows")

    print(f"\nBackup saved in: {os.path.abspath(out_dir)}")

asyncio.run(main())