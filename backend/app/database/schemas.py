from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# ── Auth ────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "clinic"
    clinic_name: Optional[str] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    clinic_name: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ── Patient ─────────────────────────────────────────────────────────
class PatientCreate(BaseModel):
    full_name: str
    phone: str
    family_phone: Optional[str] = None
    doctor_phone: Optional[str] = None
    age: Optional[int] = None
    language: str = "en"

class PatientResponse(BaseModel):
    id: str
    full_name: str
    phone: str
    age: Optional[int] = None
    language: str
    is_active: bool
    created_at: datetime
    user_id: Optional[str] = None
    invite_code: Optional[str] = None

    class Config:
        from_attributes = True

# ── Prescription ────────────────────────────────────────────────────
class PrescriptionResponse(BaseModel):
    id: str
    patient_id: str
    doctor_name: Optional[str] = None
    care_plan: Optional[str] = None
    safety_flag: bool
    llm_used: str
    created_at: datetime

    class Config:
        from_attributes = True

# ── Dose Event ──────────────────────────────────────────────────────
class DoseEventResponse(BaseModel):
    id: str
    patient_id: str
    medicine_name: str
    scheduled_time: datetime
    status: str
    taken_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ── Stock ───────────────────────────────────────────────────────────
class StockResponse(BaseModel):
    id: str
    patient_id: str
    medicine_name: str
    total_quantity: int
    doses_taken: int
    doses_per_day: int

    class Config:
        from_attributes = True