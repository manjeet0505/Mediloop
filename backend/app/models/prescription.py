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

class CarePlan(BaseModel):
    patient_name: Optional[str] = "Unknown"
    doctor_name: Optional[str] = "Unknown"
    medications: List[MedicationItem]
    created_at: datetime = datetime.now()
    safety_flag: bool = False
    safety_note: Optional[str] = ""

class PrescriptionResponse(BaseModel):
    success: bool
    care_plan: Optional[CarePlan] = None
    raw_text: Optional[str] = ""
    error: Optional[str] = None
    llm_used: str = "claude"