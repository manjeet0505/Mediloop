from datetime import datetime
from typing import Dict, List
from app.models.stock import MedicineStock, StockAlert, ReorderApproval

# In-memory store
stock_db: Dict[str, List[MedicineStock]] = {}
reorder_log: Dict[str, list] = {}

REORDER_THRESHOLD_DAYS = 7

def get_pharmeasy_link(medicine_name: str) -> str:
    """Generate Pharmeasy search deep-link"""
    query = medicine_name.replace(" ", "+")
    return f"https://pharmeasy.in/search/all?name={query}"

def get_1mg_link(medicine_name: str) -> str:
    """Generate 1mg search deep-link"""
    query = medicine_name.replace(" ", "-").lower()
    return f"https://www.1mg.com/search/all?name={query}"

def add_medicine_stock(stock: MedicineStock) -> dict:
    """Add or update medicine stock for a patient"""
    if stock.patient_id not in stock_db:
        stock_db[stock.patient_id] = []

    # Update if exists
    for i, s in enumerate(stock_db[stock.patient_id]):
        if s.medicine_name.lower() == stock.medicine_name.lower():
            stock_db[stock.patient_id][i] = stock
            return {"message": "Stock updated", "stock": stock}

    # Add new
    stock_db[stock.patient_id].append(stock)
    return {"message": "Stock added", "stock": stock}

def calculate_remaining_days(stock: MedicineStock) -> int:
    """Calculate remaining days based on actual consumption"""
    remaining_quantity = stock.total_quantity - stock.doses_taken
    if stock.doses_per_day <= 0:
        return 0
    return remaining_quantity // stock.doses_per_day

def check_stock_levels(patient_id: str) -> List[StockAlert]:
    """Check all medicines for a patient and return alerts"""
    if patient_id not in stock_db:
        return []

    alerts = []
    for stock in stock_db[patient_id]:
        remaining_days = calculate_remaining_days(stock)
        remaining_quantity = stock.total_quantity - stock.doses_taken
        reorder_suggested = remaining_days <= REORDER_THRESHOLD_DAYS

        if reorder_suggested:
            message = (
                f"⚠️ Stock Alert: {stock.medicine_name} will run out in "
                f"{remaining_days} days ({remaining_quantity} doses left). "
                f"Reorder now?"
            )
        else:
            message = (
                f"✅ {stock.medicine_name}: {remaining_days} days remaining "
                f"({remaining_quantity} doses left). Stock is sufficient."
            )

        alert = StockAlert(
            patient_id=patient_id,
            medicine_name=stock.medicine_name,
            remaining_days=remaining_days,
            remaining_quantity=remaining_quantity,
            reorder_suggested=reorder_suggested,
            pharmeasy_link=get_pharmeasy_link(stock.medicine_name),
            message=message
        )
        alerts.append(alert)

    return alerts

def update_doses_taken(patient_id: str, medicine_name: str, doses: int = 1) -> dict:
    """Update doses taken count after confirmation"""
    if patient_id not in stock_db:
        return {"success": False, "error": "Patient not found"}

    for stock in stock_db[patient_id]:
        if stock.medicine_name.lower() == medicine_name.lower():
            stock.doses_taken += doses
            remaining_days = calculate_remaining_days(stock)
            return {
                "success": True,
                "medicine": medicine_name,
                "doses_taken": stock.doses_taken,
                "remaining_days": remaining_days,
                "reorder_alert": remaining_days <= REORDER_THRESHOLD_DAYS
            }

    return {"success": False, "error": "Medicine not found"}

def process_reorder(approval: ReorderApproval) -> dict:
    """Process reorder approval from patient"""
    if not approval.approved:
        return {
            "success": False,
            "message": f"Reorder cancelled for {approval.medicine_name}"
        }

    # Log the reorder
    if approval.patient_id not in reorder_log:
        reorder_log[approval.patient_id] = []

    reorder_log[approval.patient_id].append({
        "medicine": approval.medicine_name,
        "ordered_at": datetime.now().isoformat(),
        "status": "order_placed"
    })

    pharmeasy_link = get_pharmeasy_link(approval.medicine_name)
    mg1_link = get_1mg_link(approval.medicine_name)

    return {
        "success": True,
        "message": f"✅ Reorder initiated for {approval.medicine_name}!",
        "order_options": {
            "pharmeasy": pharmeasy_link,
            "1mg": mg1_link
        },
        "instruction": "Click any link above to complete your order. Delivery in 24-48 hours."
    }

def get_stock_summary(patient_id: str) -> dict:
    """Get complete stock summary for a patient"""
    if patient_id not in stock_db:
        return {"patient_id": patient_id, "message": "No stock data found"}

    alerts = check_stock_levels(patient_id)
    critical = [a for a in alerts if a.remaining_days <= 3]
    warning = [a for a in alerts if 3 < a.remaining_days <= 7]
    good = [a for a in alerts if a.remaining_days > 7]

    return {
        "patient_id": patient_id,
        "total_medicines": len(stock_db[patient_id]),
        "critical": [a.dict() for a in critical],
        "warning": [a.dict() for a in warning],
        "good": [a.dict() for a in good],
        "reorder_history": reorder_log.get(patient_id, [])
    }