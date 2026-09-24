from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
import os

from app.database.connection import get_db
from app.database.models import User
from app.utils.auth import get_current_user, decode_token
from app.services.google_calendar_service import get_authorization_url, exchange_code_and_save

router = APIRouter(prefix="/api/v1/calendar", tags=["calendar"])

FRONTEND_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")


@router.get("/connect")
async def connect_calendar(current_user: User = Depends(get_current_user)):
    if current_user.role not in ("clinic", "doctor"):
        raise HTTPException(status_code=403, detail="Clinic/doctor access only")

    # state carries the user's own JWT so callback can identify them
    # (Google redirects back with no auth header, so we pass identity via state)
    from app.utils.auth import create_access_token
    state_token = create_access_token({"sub": current_user.id})

    auth_url = get_authorization_url(state=state_token)
    return {"authorization_url": auth_url}


@router.get("/callback")
async def calendar_callback(code: str, state: str, db: AsyncSession = Depends(get_db)):
    try:
        payload = decode_token(state)
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid state")

    await exchange_code_and_save(code, user_id, db)
    return RedirectResponse(url=f"{FRONTEND_URL}/dashboard/settings?calendar=connected")


@router.get("/status")
async def calendar_status(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    from app.database.models import CalendarCredential
    result = await db.execute(select(CalendarCredential).where(CalendarCredential.user_id == current_user.id))
    connected = result.scalar_one_or_none() is not None
    return {"connected": connected}