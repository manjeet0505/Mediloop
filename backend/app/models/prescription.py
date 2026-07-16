from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class MedicationItem(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = ""
    times_per_day: int = 1
    confidence: float = 1.0  # 0-1, how confident the model is in this extraction


class CarePlan(BaseModel):
    patient_name: Optional[str] = "Unknown"
    doctor_name: Optional[str] = "Unknown"
    medications: List[MedicationItem]
    created_at: datetime = datetime.now()
    safety_flag: bool = False
    safety_note: Optional[str] = ""
    overall_confidence: float = 1.0


class PrescriptionResponse(BaseModel):
    success: bool
    care_plan: Optional[CarePlan] = None
    raw_text: Optional[str] = ""
    error: Optional[str] = None
    llm_used: str = "openai"


class ConfirmMedicationItem(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = ""
    times_per_day: int = 1


class ConfirmPrescriptionRequest(BaseModel):
    patient_id: str
    doctor_name: Optional[str] = "Unknown"
    raw_text: Optional[str] = ""
    safety_flag: bool = False
    safety_note: Optional[str] = ""
    medications: List[ConfirmMedicationItem]