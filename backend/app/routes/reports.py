from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os

from app.database.connection import get_db
from app.database.models import User, Patient, WeeklyReport
from app.utils.auth import get_current_user
from app.routes.patient import get_linked_patient
from app.routes.vitals import get_clinic_owned_patient

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


async def get_report_or_404(report_id: str, db: AsyncSession) -> WeeklyReport:
    result = await db.execute(select(WeeklyReport).where(WeeklyReport.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.get("/{report_id}/download")
async def download_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    report = await get_report_or_404(report_id, db)

    # Ownership check: either the patient themself, or the clinic that owns them
    if current_user.role == "patient":
        patient = await get_linked_patient(current_user, db)
        if patient.id != report.patient_id:
            raise HTTPException(status_code=403, detail="Not your report")
    elif current_user.role in ("clinic", "doctor"):
        await get_clinic_owned_patient(report.patient_id, current_user, db)
    else:
        raise HTTPException(status_code=403, detail="Access denied")

    if not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="Report file missing on server")

    return FileResponse(
        path=report.file_path,
        media_type="application/pdf",
        filename=f"weekly-report-{report.week_start.date()}.pdf",
    )


@router.get("/me")
async def list_my_reports(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    patient = await get_linked_patient(current_user, db)
    result = await db.execute(
        select(WeeklyReport)
        .where(WeeklyReport.patient_id == patient.id)
        .order_by(WeeklyReport.week_start.desc())
    )
    reports = result.scalars().all()
    return [
        {
            "id": r.id,
            "week_start": r.week_start.isoformat(),
            "week_end": r.week_end.isoformat(),
            "adherence_pct": r.adherence_pct,
            "created_at": r.created_at.isoformat(),
        }
        for r in reports
    ]