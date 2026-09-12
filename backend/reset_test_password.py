import asyncio
from sqlalchemy import select
from app.database.connection import AsyncSessionLocal
from app.database.models import User
from app.utils.auth import hash_password

EMAIL = "testpatient@example.com"
NEW_PASSWORD = "test1234"

async def reset():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == EMAIL))
        user = result.scalar_one_or_none()
        if not user:
            print(f"No user found with email {EMAIL}")
            return
        user.hashed_password = hash_password(NEW_PASSWORD)
        await db.commit()
        print(f"Password reset for {EMAIL} → {NEW_PASSWORD}")

asyncio.run(reset())