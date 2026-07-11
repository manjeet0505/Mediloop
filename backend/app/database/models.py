from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base
import enum
import uuid

def generate_uuid():
    return str(uuid.uuid4())

# ── Enums ──────────────────────────────────────────────────────────
class DoseStatusEnum(str, enum.Enum):
    pending = "pending"
    taken = "taken"
    missed = "missed"

class EscalationLevelEnum(str, enum.Enum):
    normal = "normal"
    family = "family"
    doctor = "doctor"
    emergency = "emergency"

class UserRoleEnum(str, enum.Enum):
    clinic = "clinic"
    patient = "patient"
    doctor = "doctor"

# ── Users (Clinic / Doctor / Patient login) ────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="clinic")
    clinic_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patients = relationship("Patient", back_populates="clinic", foreign_keys="[Patient.clinic_id]")

# ── Patients ───────────────────────────────────────────────────────
class Patient(Base):
    __tablename__ = "patients"

    id = Column(String, primary_key=True, default=generate_uuid)
    clinic_id = Column(String, ForeignKey("users.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=True)
    invite_code = Column(String, unique=True, nullable=True, index=True)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    family_phone = Column(String, nullable=True)
    doctor_phone = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    language = Column(String, default="en")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    clinic = relationship("User", back_populates="patients", foreign_keys=[clinic_id])
    prescriptions = relationship("Prescription", back_populates="patient")
    dose_events = relationship("DoseEvent", back_populates="patient")
    stock_levels = relationship("StockLevel", back_populates="patient")

# ── Prescriptions ──────────────────────────────────────────────────
class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(String, primary_key=True, default=generate_uuid)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    doctor_name = Column(String, nullable=True)
    raw_text = Column(Text, nullable=True)
    care_plan = Column(Text, nullable=True)
    safety_flag = Column(Boolean, default=False)
    safety_note = Column(String, nullable=True)
    llm_used = Column(String, default="openai")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="prescriptions")

# ── Dose Events ────────────────────────────────────────────────────
class DoseEvent(Base):
    __tablename__ = "dose_events"

    id = Column(String, primary_key=True, default=generate_uuid)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    medicine_name = Column(String, nullable=False)
    dosage = Column(String, nullable=True)
    scheduled_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, default="pending")
    taken_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="dose_events")

# ── Stock Levels ───────────────────────────────────────────────────
class StockLevel(Base):
    __tablename__ = "stock_levels"

    id = Column(String, primary_key=True, default=generate_uuid)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    medicine_name = Column(String, nullable=False)
    total_quantity = Column(Integer, nullable=False)
    doses_taken = Column(Integer, default=0)
    doses_per_day = Column(Integer, default=1)
    start_date = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", back_populates="stock_levels")