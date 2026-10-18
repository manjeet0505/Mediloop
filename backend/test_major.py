from dotenv import load_dotenv
load_dotenv(override=True)

import asyncio
from app.services.interaction_service import evaluate_new_medicines

async def main():
    r = await evaluate_new_medicines(["Verapamil 40mg"], ["Betaloc 100mg"])
    print("has_major:", r["has_major"])
    print("note:")
    print(r["note"])

asyncio.run(main())