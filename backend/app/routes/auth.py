from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.connection import get_db
from app.database.models import User, Patient
from app.database.schemas import UserCreate, UserLogin, UserResponse, Token
from app.utils.auth import hash_password, verify_password, create_access_token, get_current_user
from app.utils.validators import validate_email, validate_password, validate_phone, validate_name
import uuid
from datetime import datetime, timedelta
from collections import defaultdict

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

# Simple in-memory rate limiter
_login_attempts: dict = defaultdict(list)
MAX_ATTEMPTS = 5
WINDOW_MINUTES = 15

def check_rate_limit(ip: str):
    now = datetime.utcnow()
    window = now - timedelta(minutes=WINDOW_MINUTES)
    _login_attempts[ip] = [t for t in _login_attempts[ip] if t > window]
    if len(_login_attempts[ip]) >= MAX_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail=f"Too many attempts. Try again in {WINDOW_MINUTES} minutes."
        )
    _login_attempts[ip].append(now)

@router.post("/signup", response_model=Token)
async def signup(data: UserCreate, request: Request, db: AsyncSession = Depends(get_db)):
    # Rate limit
    check_rate_limit(request.client.host)

    # Validate inputs
    email = validate_email(data.email)
    validate_password(data.password)
    validate_name(data.full_name)
    if data.phone:
        validate_phone(data.phone)

    # Check duplicate email
    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Patient signup requires a valid, unclaimed invite code
    patient_to_link = None
    if data.role == "patient":
        if not data.invite_code:
            raise HTTPException(status_code=400, detail="Invite code is required for patient signup")

        code = data.invite_code.strip().upper()
        result = await db.execute(select(Patient).where(Patient.invite_code == code))
        patient_to_link = result.scalar_one_or_none()

        if not patient_to_link:
            raise HTTPException(status_code=404, detail="Invalid invite code")
        if patient_to_link.user_id:
            raise HTTPException(status_code=400, detail="This invite code has already been used")

    # Create user
    user = User(
        id=str(uuid.uuid4()),
        email=email,
        hashed_password=hash_password(data.password),
        full_name=validate_name(data.full_name),
        role=data.role,
        clinic_name=data.clinic_name,
        phone=data.phone,
    )
    db.add(user)
    await db.flush()  # ensures user.id is available without committing yet

    # Link patient row to this new login
    if patient_to_link:
        patient_to_link.user_id = user.id

    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": user.id, "role": user.role})
    return Token(access_token=token, user=UserResponse.model_validate(user))

@router.post("/login", response_model=Token)
async def login(data: UserLogin, request: Request, db: AsyncSession = Depends(get_db)):
    # Rate limit
    check_rate_limit(request.client.host)

    # Validate
    email = validate_email(data.email)
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    # Same error for wrong email or password — prevents user enumeration
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")

    token = create_access_token({"sub": user.id, "role": user.role})
    return Token(access_token=token, user=UserResponse.model_validate(user))

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}