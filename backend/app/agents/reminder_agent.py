from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
from typing import Dict, List
import uuid
from app.models.reminder import (
    ReminderSchedule, DoseEvent, DoseStatus, 
    EscalationLevel, EscalationAlert
)

# In-memory store (Redis mein migrate karenge baad mein)
active_schedules: Dict[str, ReminderSchedule] = {}
dose_logs: Dict[str, List[DoseEvent]] = {}

scheduler = BackgroundScheduler()
scheduler.start()

# Message templates
MESSAGES = {
    "en": {
        "reminder": "💊 Medicine Reminder: Time to take {medicine} ({dosage}). Reply 1 to confirm.",
        "missed": "⚠️ Missed dose alert: {patient} missed {medicine}. Please take it now.",
        "family_alert": "🚨 Family Alert: {patient} has missed {count} doses of {medicine}. Please check on them.",
        "doctor_alert": "🏥 Doctor Alert: Patient {patient} has missed {count} consecutive doses. Immediate attention needed.",
    },
    "hi": {
        "reminder": "💊 दवाई याद दिलाना: {medicine} ({dosage}) लेने का समय हो गया है। पुष्टि के लिए 1 दबाएं।",
        "missed": "⚠️ छूटी हुई खुराक: {patient} ने {medicine} नहीं ली। कृपया अभी लें।",
        "family_alert": "🚨 परिवार अलर्ट: {patient} ने {count} बार {medicine} नहीं ली। कृपया उनकी जांच करें।",
        "doctor_alert": "🏥 डॉक्टर अलर्ट: मरीज {patient} ने {count} बार दवाई नहीं ली। तत्काल ध्यान चाहिए।",
    }
}

def send_whatsapp_message(phone: str, message: str, patient_id: str = ""):
    """
    WhatsApp message sender - Console simulation for now
    Replace with actual WhatsApp Business API later
    """
    print(f"\n{'='*50}")
    print(f"📱 WHATSAPP MESSAGE")
    print(f"To: {phone}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Message: {message}")
    print(f"{'='*50}\n")
    
    # TODO: Replace with real WhatsApp Business API
    # requests.post(WHATSAPP_API_URL, json={
    #     "to": phone,
    #     "message": message
    # })
    return True

def check_and_escalate(patient_id: str):
    """Check missed doses and escalate if needed"""
    if patient_id not in active_schedules:
        return
    
    schedule = active_schedules[patient_id]
    logs = dose_logs.get(patient_id, [])
    
    # Count recent missed doses
    recent_missed = [
        log for log in logs 
        if log.status == DoseStatus.MISSED 
        and log.scheduled_time > datetime.now() - timedelta(days=1)
    ]
    
    missed_count = len(recent_missed)
    lang = schedule.language
    messages = MESSAGES.get(lang, MESSAGES["en"])
    
    # Update missed count
    schedule.missed_count = missed_count

    if missed_count >= 7:
        schedule.escalation_level = EscalationLevel.EMERGENCY
        msg = messages["doctor_alert"].format(
            patient=schedule.patient_name,
            count=missed_count
        )
        if schedule.doctor_phone:
            send_whatsapp_message(schedule.doctor_phone, msg, patient_id)
            
    elif missed_count >= 3:
        schedule.escalation_level = EscalationLevel.FAMILY_ALERT
        for med in schedule.medications:
            msg = messages["family_alert"].format(
                patient=schedule.patient_name,
                count=missed_count,
                medicine=med.get("medicine_name", "medicine")
            )
            if schedule.family_phone:
                send_whatsapp_message(schedule.family_phone, msg, patient_id)

def send_dose_reminder(patient_id: str, medicine_name: str, dosage: str):
    """Send reminder for a specific dose"""
    if patient_id not in active_schedules:
        return
    
    schedule = active_schedules[patient_id]
    lang = schedule.language
    messages = MESSAGES.get(lang, MESSAGES["en"])
    
    # Log this dose as pending
    dose_event = DoseEvent(
        id=str(uuid.uuid4()),
        patient_id=patient_id,
        medicine_name=medicine_name,
        scheduled_time=datetime.now(),
        status=DoseStatus.PENDING
    )
    
    if patient_id not in dose_logs:
        dose_logs[patient_id] = []
    dose_logs[patient_id].append(dose_event)
    
    # Send reminder message
    msg = messages["reminder"].format(
        medicine=medicine_name,
        dosage=dosage
    )
    send_whatsapp_message(schedule.patient_phone, msg, patient_id)
    
    # Schedule missed dose check after 2 hours
    scheduler.add_job(
        mark_dose_missed,
        'date',
        run_date=datetime.now() + timedelta(hours=2),
        args=[patient_id, dose_event.id],
        id=f"missed_{dose_event.id}"
    )

def mark_dose_missed(patient_id: str, dose_id: str):
    """Mark dose as missed if not confirmed after 2 hours"""
    logs = dose_logs.get(patient_id, [])
    for log in logs:
        if log.id == dose_id and log.status == DoseStatus.PENDING:
            log.status = DoseStatus.MISSED
            print(f"⚠️ Dose {dose_id} marked as MISSED for patient {patient_id}")
            check_and_escalate(patient_id)
            break

def confirm_dose_taken(patient_id: str, medicine_name: str) -> bool:
    """Patient confirms dose taken - called when patient replies '1'"""
    logs = dose_logs.get(patient_id, [])
    
    for log in reversed(logs):
        if (log.medicine_name == medicine_name 
            and log.status == DoseStatus.PENDING
            and log.patient_id == patient_id):
            log.status = DoseStatus.TAKEN
            log.taken_at = datetime.now()
            print(f"✅ Dose confirmed for {patient_id} - {medicine_name}")
            return True
    return False

def schedule_patient_reminders(schedule: ReminderSchedule) -> dict:
    """Schedule all reminders for a patient based on their care plan"""
    
    active_schedules[schedule.patient_id] = schedule
    dose_logs[schedule.patient_id] = []
    scheduled_jobs = []
    
    for med in schedule.medications:
        medicine_name = med.get("medicine_name", "Medicine")
        dosage = med.get("dosage", "")
        times_per_day = med.get("times_per_day", 1)
        
        # Schedule based on times_per_day
        if times_per_day == 1:
            times = ["09:00"]
        elif times_per_day == 2:
            times = ["09:00", "21:00"]
        elif times_per_day == 3:
            times = ["08:00", "14:00", "20:00"]
        else:
            times = ["09:00"]
        
        for time_str in times:
            hour, minute = map(int, time_str.split(":"))
            job_id = f"{schedule.patient_id}_{medicine_name}_{time_str}"
            
            scheduler.add_job(
                send_dose_reminder,
                CronTrigger(hour=hour, minute=minute),
                args=[schedule.patient_id, medicine_name, dosage],
                id=job_id,
                replace_existing=True
            )
            scheduled_jobs.append({
                "medicine": medicine_name,
                "time": time_str,
                "job_id": job_id
            })
    
    return {
        "patient_id": schedule.patient_id,
        "patient_name": schedule.patient_name,
        "scheduled_jobs": scheduled_jobs,
        "total_reminders_per_day": len(scheduled_jobs)
    }

def get_adherence_stats(patient_id: str) -> dict:
    """Get adherence statistics for a patient"""
    logs = dose_logs.get(patient_id, [])
    
    if not logs:
        return {"patient_id": patient_id, "message": "No dose logs found"}
    
    total = len(logs)
    taken = len([l for l in logs if l.status == DoseStatus.TAKEN])
    missed = len([l for l in logs if l.status == DoseStatus.MISSED])
    pending = len([l for l in logs if l.status == DoseStatus.PENDING])
    
    adherence_score = (taken / total * 100) if total > 0 else 0
    schedule = active_schedules.get(patient_id)
    
    return {
        "patient_id": patient_id,
        "patient_name": schedule.patient_name if schedule else "Unknown",
        "total_doses": total,
        "taken": taken,
        "missed": missed,
        "pending": pending,
        "adherence_score": round(adherence_score, 2),
        "escalation_level": schedule.escalation_level if schedule else 0,
        "missed_count": schedule.missed_count if schedule else 0
    }