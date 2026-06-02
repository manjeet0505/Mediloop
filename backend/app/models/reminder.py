from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class DoseStatus(str, Enum):
    PENDING = "pending"
    TAKEN = "taken"
    MISSED = "missed"

class EscalationLevel(int, Enum):
    NORMAL = 0
    FAMILY_ALERT = 1
    DOCTOR_ALERT = 2
    EMERGENCY = 3

class DoseEvent(BaseModel):
    id: Optional[str] = None
    patient_id: str
    medicine_name: str
    scheduled_time: datetime
    status: DoseStatus = DoseStatus.PENDING
    taken_at: Optional[datetime] = None

class ReminderSchedule(BaseModel):
    patient_id: str
    patient_name: str
    patient_phone: str
    family_phone: Optional[str] = ""
    doctor_phone: Optional[str] = ""
    medications: List[dict]
    language: str = "en"
    escalation_level: EscalationLevel = EscalationLevel.NORMAL
    missed_count: int = 0
    created_at: datetime = datetime.now()

class DoseConfirmation(BaseModel):
    patient_id: str
    medicine_name: str
    scheduled_time: datetime

class EscalationAlert(BaseModel):
    patient_id: str
    patient_name: str
    missed_count: int
    escalation_level: EscalationLevel
    alert_message: str
    alert_to: str