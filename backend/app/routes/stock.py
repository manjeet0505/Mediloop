from fastapi import APIRouter
from app.agents.stock_agent import (
    add_medicine_stock,
    check_stock_levels,
    update_doses_taken,
    process_reorder,
    get_stock_summary
)
from app.models.stock import MedicineStock, ReorderApproval

router = APIRouter(prefix="/api/v1/stock", tags=["Stock Agent"])

@router.post("/add")
async def add_stock(stock: MedicineStock):
    """Agent 3 - Add medicine stock for a patient"""
    result = add_medicine_stock(stock)
    return {"success": True, "data": result}

@router.get("/check/{patient_id}")
async def check_stock(patient_id: str):
    """Check stock levels and get reorder alerts"""
    alerts = check_stock_levels(patient_id)
    if not alerts:
        return {"success": False, "message": "No stock data found"}
    return {"success": True, "alerts": [a.dict() for a in alerts]}

@router.post("/update-doses")
async def update_doses(patient_id: str, medicine_name: str, doses: int = 1):
    """Update doses taken count"""
    result = update_doses_taken(patient_id, medicine_name, doses)
    return result

@router.post("/reorder")
async def reorder_medicine(approval: ReorderApproval):
    """Patient approves or rejects reorder"""
    result = process_reorder(approval)
    return result

@router.get("/summary/{patient_id}")
async def stock_summary(patient_id: str):
    """Get complete stock summary - critical, warning, good"""
    result = get_stock_summary(patient_id)
    return {"success": True, "data": result}