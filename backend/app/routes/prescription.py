from fastapi import APIRouter, UploadFile, File, HTTPException
from app.agents.prescription_agent import process_prescription, parse_with_openai
from app.models.prescription import PrescriptionResponse

router = APIRouter(prefix="/api/v1/prescription", tags=["Prescription Agent"])

@router.post("/parse", response_model=PrescriptionResponse)
async def parse_prescription(file: UploadFile = File(...)):
    """
    Agent 1 - Upload a prescription image and get structured care plan
    Supports: JPG, PNG, PDF
    """
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPG, PNG images supported")
    
    image_bytes = await file.read()
    result = await process_prescription(image_bytes)
    return result

@router.post("/parse-text")
async def parse_prescription_text(text: str):
    """
    Test Agent 1 with raw text directly - no image needed
    """
    try:
        result = await parse_with_openai(text)
        return {"success": True, "result": result, "llm_used": "openai"}
    except Exception as e:
        return {"success": False, "error": str(e)}