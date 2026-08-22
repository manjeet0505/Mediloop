from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.connection import get_db
from app.database.models import User
from app.utils.auth import get_current_user
from app.services.stock_service import check_and_send_reorder_alerts

router = APIRouter(prefix="/api/v1/stock", tags=["Stock Agent"])


@router.post("/check-alerts")
async def trigger_stock_check(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Manually trigger the same low-stock check the scheduler runs daily —
    for demos, so you don't have to wait for 9 AM.
    """
    sent = await check_and_send_reorder_alerts(db)
    return {"success": True, "alerts_sent": sent}