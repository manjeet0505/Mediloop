"""
Google Calendar integration — OAuth flow + event sync for clinic appointments.
Each clinic user connects their own Google account once; tokens are stored
and silently refreshed when expired.
"""
import os
from datetime import datetime, timedelta, timezone
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import CalendarCredential, User, Appointment, Patient

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

SCOPES = ["https://www.googleapis.com/auth/calendar.events"]

CLIENT_CONFIG = {
    "web": {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": [GOOGLE_REDIRECT_URI],
    }
}


def get_authorization_url(state: str) -> str:
    """Step A — build the Google consent screen URL."""
    flow = Flow.from_client_config(
        CLIENT_CONFIG, scopes=SCOPES, redirect_uri=GOOGLE_REDIRECT_URI,
        autogenerate_code_verifier=False,   # ← naya — disable PKCE, hum confidential client hain
    )
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=state,
    )
    return auth_url


async def exchange_code_and_save(code: str, user_id: str, db: AsyncSession) -> None:
    """Step B — exchange the authorization code for tokens, save/update in DB."""
    flow = Flow.from_client_config(
        CLIENT_CONFIG, scopes=SCOPES, redirect_uri=GOOGLE_REDIRECT_URI,
        autogenerate_code_verifier=False,   # ← naya — match with above
    )
    flow.fetch_token(code=code)
    creds = flow.credentials

    result = await db.execute(select(CalendarCredential).where(CalendarCredential.user_id == user_id))
    existing = result.scalar_one_or_none()

    expiry = creds.expiry if creds.expiry.tzinfo else creds.expiry.replace(tzinfo=timezone.utc)

    if existing:
        existing.access_token = creds.token
        existing.refresh_token = creds.refresh_token or existing.refresh_token
        existing.token_expiry = expiry
    else:
        db.add(CalendarCredential(
            user_id=user_id,
            access_token=creds.token,
            refresh_token=creds.refresh_token,
            token_expiry=expiry,
        ))
    await db.commit()


async def get_valid_credentials(user_id: str, db: AsyncSession) -> Credentials | None:
    """
    Returns a valid google Credentials object for this user, silently
    refreshing the access_token if it has expired. Returns None if the
    user has never connected their calendar.
    """
    result = await db.execute(select(CalendarCredential).where(CalendarCredential.user_id == user_id))
    cred_row = result.scalar_one_or_none()
    if not cred_row:
        return None

    creds = Credentials(
        token=cred_row.access_token,
        refresh_token=cred_row.refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        scopes=SCOPES,
    )

    now = datetime.now(timezone.utc)
    if cred_row.token_expiry <= now:
        creds.refresh(GoogleRequest())
        cred_row.access_token = creds.token
        cred_row.token_expiry = creds.expiry.replace(tzinfo=timezone.utc) if not creds.expiry.tzinfo else creds.expiry
        await db.commit()

    return creds


async def create_calendar_event(clinic_user_id: str, appointment: Appointment, patient: Patient, db: AsyncSession) -> str | None:
    """Creates a Google Calendar event for this appointment. Returns the event ID, or None if calendar isn't connected."""
    creds = await get_valid_credentials(clinic_user_id, db)
    if not creds:
        return None

    service = build("calendar", "v3", credentials=creds)
    start = appointment.scheduled_at
    end = start + timedelta(minutes=30)

    event = {
        "summary": f"MedLoop — {patient.full_name}",
        "description": f"Patient: {patient.full_name}\nPhone: {patient.phone}\nNotes: {appointment.notes or '-'}",
        "start": {"dateTime": start.isoformat()},
        "end": {"dateTime": end.isoformat()},
    }
    created = service.events().insert(calendarId="primary", body=event).execute()
    return created.get("id")


async def update_calendar_event(clinic_user_id: str, appointment: Appointment, patient: Patient, db: AsyncSession) -> None:
    if not appointment.google_event_id:
        return
    creds = await get_valid_credentials(clinic_user_id, db)
    if not creds:
        return

    service = build("calendar", "v3", credentials=creds)
    start = appointment.scheduled_at
    end = start + timedelta(minutes=30)

    event = {
        "summary": f"MedLoop — {patient.full_name}",
        "description": f"Patient: {patient.full_name}\nPhone: {patient.phone}\nNotes: {appointment.notes or '-'}",
        "start": {"dateTime": start.isoformat()},
        "end": {"dateTime": end.isoformat()},
    }
    service.events().update(calendarId="primary", eventId=appointment.google_event_id, body=event).execute()


async def delete_calendar_event(clinic_user_id: str, google_event_id: str, db: AsyncSession) -> None:
    if not google_event_id:
        return
    creds = await get_valid_credentials(clinic_user_id, db)
    if not creds:
        return
    service = build("calendar", "v3", credentials=creds)
    try:
        service.events().delete(calendarId="primary", eventId=google_event_id).execute()
    except Exception:
        pass  # event may already be deleted on Google's side, don't crash the app