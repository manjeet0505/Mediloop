from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class MedicineStock(BaseModel):
    patient_id: str
    medicine_name: str
    total_quantity: int
    doses_taken: int = 0
    doses_per_day: int = 1
    start_date: datetime = datetime.now()

class StockAlert(BaseModel):
    patient_id: str
    medicine_name: str
    remaining_days: int
    remaining_quantity: int
    reorder_suggested: bool
    pharmeasy_link: str
    message: str

class ReorderApproval(BaseModel):
    patient_id: str
    medicine_name: str
    approved: bool