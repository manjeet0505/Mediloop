from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.database.models import User
from app.utils.auth import get_current_user
from app.services.scheduler import scheduler
import os

router = APIRouter(prefix="/api/v1/system", tags=["System"])


@router.get("/status")
async def get_system_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Real health check for the dashboard's System Status panel — no hardcoded values."""
    backend_ok = True  # trivially true if this code is executing

    try:
        await db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    scheduler_ok = scheduler.running

    whatsapp_ok = bool(os.getenv("WHATSAPP_ACCESS_TOKEN")) and bool(os.getenv("WHATSAPP_PHONE_NUMBER_ID"))

    return {
        "backend": backend_ok,
        "database": db_ok,
        "scheduler": scheduler_ok,
        "whatsapp": whatsapp_ok,
    }