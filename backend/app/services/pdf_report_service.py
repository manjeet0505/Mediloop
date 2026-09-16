"""
Weekly PDF report generator for a patient — adherence, missed doses,
vitals summary, and a GPT-4o narrative built from the real computed
numbers (not raw model guessing on health data).
"""
import os
import uuid
from datetime import datetime, timedelta, timezone
from openai import OpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from app.database.models import Patient, DoseEvent, VitalReading, WeeklyReport

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

REPORTS_DIR = "reports"
os.makedirs(REPORTS_DIR, exist_ok=True)

VITAL_LABELS = {
    "bp": "Blood Pressure",
    "blood_sugar": "Blood Sugar",
    "weight": "Weight",
    "spo2": "SpO2",
    "heart_rate": "Heart Rate",
}


async def collect_week_data(patient: Patient, db: AsyncSession, week_start: datetime, week_end: datetime) -> dict:
    """Pulls raw numbers — no LLM involved here, pure DB aggregation."""

    result = await db.execute(
        select(DoseEvent).where(
            DoseEvent.patient_id == patient.id,
            DoseEvent.scheduled_time >= week_start,
            DoseEvent.scheduled_time < week_end,
        )
    )
    doses = result.scalars().all()
    taken = sum(1 for d in doses if d.status == "taken")
    missed = sum(1 for d in doses if d.status == "missed")
    counted = taken + missed
    adherence_pct = round((taken / counted) * 100) if counted > 0 else 100

    result = await db.execute(
        select(VitalReading).where(
            VitalReading.patient_id == patient.id,
            VitalReading.recorded_at >= week_start,
            VitalReading.recorded_at < week_end,
        ).order_by(VitalReading.recorded_at)
    )
    vitals = result.scalars().all()

    vitals_by_type: dict = {}
    for v in vitals:
        vitals_by_type.setdefault(v.vital_type, []).append(v)

    vitals_summary = {}
    for vtype, readings in vitals_by_type.items():
        values = [r.value_1 for r in readings]
        vitals_summary[vtype] = {
            "label": VITAL_LABELS.get(vtype, vtype),
            "count": len(readings),
            "min": min(values),
            "max": max(values),
            "avg": round(sum(values) / len(values), 1),
            "normal_count": sum(1 for r in readings if r.status == "normal"),
            "watch_count": sum(1 for r in readings if r.status == "watch"),
            "critical_count": sum(1 for r in readings if r.status == "critical"),
        }

    return {
        "adherence_pct": adherence_pct,
        "taken": taken,
        "missed": missed,
        "vitals_summary": vitals_summary,
    }


def generate_ai_summary(patient_name: str, data: dict) -> str:
    """
    GPT-4o generates a natural-language summary FROM the already-computed
    numbers above — it never sees raw unprocessed data and never makes
    clinical judgments, it only narrates what the deterministic logic found.
    """
    vitals_lines = []
    for vtype, v in data["vitals_summary"].items():
        vitals_lines.append(
            f"{v['label']}: {v['count']} readings, avg {v['avg']}, range {v['min']}-{v['max']}, "
            f"{v['watch_count']} watch, {v['critical_count']} critical"
        )
    vitals_text = "\n".join(vitals_lines) if vitals_lines else "No vitals logged this week."

    prompt = f"""You are writing a brief, warm, factual weekly health summary for a patient named {patient_name}.
Use ONLY the data below. Do not invent numbers, do not give medical advice or diagnoses,
just summarize the pattern in 2-3 short sentences in plain, encouraging language.

Adherence: {data['adherence_pct']}% ({data['taken']} taken, {data['missed']} missed)
Vitals:
{vitals_text}
"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=150,
        temperature=0.4,
    )
    return response.choices[0].message.content.strip()


def build_pdf(patient_name: str, week_start: datetime, week_end: datetime, data: dict, ai_summary: str, file_path: str):
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("TitleStyle", parent=styles["Title"], fontSize=18, spaceAfter=6)
    heading_style = ParagraphStyle("HeadingStyle", parent=styles["Heading2"], spaceBefore=14, spaceAfter=6)
    body_style = styles["BodyText"]

    doc = SimpleDocTemplate(file_path, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
    elements = []

    elements.append(Paragraph(f"Weekly Health Report — {patient_name}", title_style))
    elements.append(Paragraph(f"{week_start.strftime('%d %b %Y')} – {week_end.strftime('%d %b %Y')}", body_style))
    elements.append(Spacer(1, 0.5*cm))

    elements.append(Paragraph("AI Summary", heading_style))
    elements.append(Paragraph(ai_summary, body_style))

    elements.append(Paragraph("Medication Adherence", heading_style))
    adherence_table = Table([
        ["Adherence", "Taken", "Missed"],
        [f"{data['adherence_pct']}%", str(data['taken']), str(data['missed'])],
    ], colWidths=[5*cm, 5*cm, 5*cm])
    adherence_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6366f1")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]))
    elements.append(adherence_table)

    if data["vitals_summary"]:
        elements.append(Paragraph("Vitals Summary", heading_style))
        rows = [["Vital", "Readings", "Avg", "Range", "Watch", "Critical"]]
        for v in data["vitals_summary"].values():
            rows.append([
                v["label"], str(v["count"]), str(v["avg"]),
                f"{v['min']}–{v['max']}", str(v["watch_count"]), str(v["critical_count"])
            ])
        vitals_table = Table(rows, colWidths=[3.5*cm, 2.3*cm, 2.3*cm, 3*cm, 2*cm, 2.2*cm])
        vitals_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6366f1")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
        ]))
        elements.append(vitals_table)
    else:
        elements.append(Paragraph("No vitals logged this week.", body_style))

    doc.build(elements)


async def generate_weekly_report(patient: Patient, db: AsyncSession) -> WeeklyReport:
    now = datetime.now(timezone.utc)
    week_end = now
    week_start = now - timedelta(days=7)

    data = await collect_week_data(patient, db, week_start, week_end)
    ai_summary = generate_ai_summary(patient.full_name, data)

    report_id = str(uuid.uuid4())
    filename = f"{patient.id}_{week_start.date()}.pdf"
    file_path = os.path.join(REPORTS_DIR, filename)

    build_pdf(patient.full_name, week_start, week_end, data, ai_summary, file_path)

    report = WeeklyReport(
        id=report_id,
        patient_id=patient.id,
        file_path=file_path,
        week_start=week_start,
        week_end=week_end,
        adherence_pct=data["adherence_pct"],
        ai_summary=ai_summary,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report