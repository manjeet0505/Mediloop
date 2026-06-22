from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.utils.auth import get_current_user
from app.models import Patient, Prescription
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/patient", tags=["patient-portal"])

class MedicineOut(BaseModel):
    id: str
    name: str
    dosage: str
    frequency: str
    times_per_day: int
    color: str = "#6366f1"

class AdherenceOut(BaseModel):
    overall: int
    streak: int
    taken_total: int
    missed_total: int
    week: list

@router.get("/me")
async def get_my_profile(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Patient access only")
    return {
        "id": str(current_user.id),
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role,
    }

@router.get("/me/medicines")
async def get_my_medicines(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Patient access only")
    # For now return structured mock tied to user
    # Phase 2: pull from prescriptions table
    return [
        {"id": "1", "name": "Metformin", "dosage": "500mg", "frequency": "Twice daily", "time": "9:00 AM", "taken": False, "color": "#6366f1"},
        {"id": "2", "name": "Metformin", "dosage": "500mg", "frequency": "Twice daily", "time": "9:00 PM", "taken": False, "color": "#6366f1"},
        {"id": "3", "name": "Amlodipine", "dosage": "5mg", "frequency": "Once daily", "time": "9:00 AM", "taken": False, "color": "#06b6d4"},
    ]

@router.post("/me/confirm-dose/{medicine_id}")
async def confirm_dose(
    medicine_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Patient access only")
    # Will write to dose_logs table in Phase 2
    return {"confirmed": True, "medicine_id": medicine_id, "user_id": str(current_user.id)}

@router.get("/me/adherence")
async def get_adherence(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Patient access only")
    return {
        "overall": 87,
        "streak": 5,
        "taken_total": 52,
        "missed_total": 8,
        "week": [
            {"d": "M", "p": 100}, {"d": "T", "p": 67}, {"d": "W", "p": 100},
            {"d": "T", "p": 33}, {"d": "F", "p": 100}, {"d": "S", "p": 67}, {"d": "S", "p": 67},
        ]
    }

@router.get("/me/stock")
async def get_stock(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Patient access only")
    return [
        {"name": "Metformin", "dosage": "500mg", "remaining": 10, "total": 60, "days_left": 5, "color": "#6366f1"},
        {"name": "Amlodipine", "dosage": "5mg", "remaining": 45, "total": 60, "days_left": 45, "color": "#06b6d4"},
    ]