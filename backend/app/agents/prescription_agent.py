import pytesseract
from PIL import Image
import openai
import json
import io
from app.config import settings
from app.models.prescription import CarePlan, MedicationItem, PrescriptionResponse

# Tesseract path for Windows
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Safety check - common medicines with max doses
SAFETY_CHECKS = {
    "metformin": 2000,
    "paracetamol": 4000,
    "aspirin": 4000,
    "ibuprofen": 2400,
    "amoxicillin": 3000,
}

def extract_text_from_image(image_bytes: bytes) -> str:
    try:
        image = Image.open(io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        return f"OCR_ERROR: {str(e)}"

def check_safety(medications: list) -> tuple[bool, str]:
    for med in medications:
        med_lower = med.get("medicine_name", "").lower()
        for drug, max_dose in SAFETY_CHECKS.items():
            if drug in med_lower:
                try:
                    dose_num = int(''.join(filter(str.isdigit, med.get("dosage", "0"))))
                    if dose_num > max_dose:
                        return True, f"Unusual dosage for {med['medicine_name']}: {med['dosage']}. Please verify."
                except:
                    pass
    return False, ""

PARSE_PROMPT = """You are a medical prescription parser. Extract all medicines from this prescription text and return ONLY a valid JSON object.

Prescription text:
{text}

Return this exact JSON format, nothing else:
{{
    "patient_name": "name or Unknown",
    "doctor_name": "name or Unknown",
    "medications": [
        {{
            "medicine_name": "medicine name",
            "dosage": "dosage like 500mg",
            "frequency": "frequency like twice daily",
            "duration": "duration like 7 days",
            "instructions": "any special instructions",
            "times_per_day": 2
        }}
    ]
}}"""

async def parse_with_openai(text: str) -> dict:
    client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=1000,
        messages=[{"role": "user", "content": PARSE_PROMPT.format(text=text)}]
    )
    response_text = response.choices[0].message.content.strip()
    if "```" in response_text:
        response_text = response_text.split("```")[1]
        if response_text.startswith("json"):
            response_text = response_text[4:]
    return json.loads(response_text)

async def process_prescription(image_bytes: bytes) -> PrescriptionResponse:
    # Step 1: OCR
    raw_text = extract_text_from_image(image_bytes)
    if raw_text.startswith("OCR_ERROR"):
        return PrescriptionResponse(success=False, error=raw_text)

    if len(raw_text.strip()) < 10:
        return PrescriptionResponse(success=False, error="Could not extract text from image. Please use a clearer photo.")

    # Step 2: Parse with OpenAI
    try:
        parsed = await parse_with_openai(raw_text)
    except Exception as e:
        return PrescriptionResponse(success=False, error=f"Parsing failed: {str(e)}")

    # Step 3: Safety check
    safety_flag, safety_note = check_safety(parsed.get("medications", []))

    # Step 4: Build care plan
    medications = [MedicationItem(**med) for med in parsed.get("medications", [])]
    care_plan = CarePlan(
        patient_name=parsed.get("patient_name", "Unknown"),
        doctor_name=parsed.get("doctor_name", "Unknown"),
        medications=medications,
        safety_flag=safety_flag,
        safety_note=safety_note
    )

    return PrescriptionResponse(
        success=True,
        care_plan=care_plan,
        raw_text=raw_text,
        llm_used="openai"
    )