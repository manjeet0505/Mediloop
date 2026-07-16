import openai
import json
import base64
from app.config import settings
from app.models.prescription import CarePlan, MedicationItem, PrescriptionResponse

# Safety check - common medicines with max doses (mg/day)
SAFETY_CHECKS = {
    "metformin": 2000,
    "paracetamol": 4000,
    "aspirin": 4000,
    "ibuprofen": 2400,
    "amoxicillin": 3000,
}

VISION_PARSE_PROMPT = """You are a medical prescription parser. Look at this prescription image carefully — it may be handwritten, printed, or a photo of a physical prescription pad. Extract all medicines and patient/doctor info.

Return ONLY a valid JSON object, nothing else, no markdown fences. Use this exact format:
{
    "patient_name": "name or Unknown",
    "doctor_name": "name or Unknown",
    "medications": [
        {
            "medicine_name": "medicine name",
            "dosage": "dosage like 500mg",
            "frequency": "frequency like twice daily",
            "duration": "duration like 7 days",
            "instructions": "any special instructions, empty string if none",
            "times_per_day": 2,
            "confidence": 0.95
        }
    ],
    "overall_confidence": 0.9
}

For "confidence" on each medication (0.0 to 1.0): use LOWER confidence if the handwriting is unclear, the text is ambiguous, or you had to guess. Use HIGHER confidence only when the text is clearly legible. "overall_confidence" reflects your confidence in the whole extraction.

If you cannot read the image at all or it isn't a prescription, return medications as an empty array and overall_confidence as 0.
"""


def check_safety(medications: list) -> tuple[bool, str]:
    for med in medications:
        med_lower = med.get("medicine_name", "").lower()
        for drug, max_dose in SAFETY_CHECKS.items():
            if drug in med_lower:
                try:
                    dose_num = int(''.join(filter(str.isdigit, med.get("dosage", "0"))))
                    if dose_num > max_dose:
                        return True, f"Unusual dosage for {med['medicine_name']}: {med['dosage']}. Please verify."
                except Exception:
                    pass
    return False, ""


async def parse_with_vision(image_bytes: bytes, content_type: str) -> dict:
    """Single call: reads the image AND extracts structured data — no separate OCR step."""
    client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

    b64_image = base64.b64encode(image_bytes).decode("utf-8")
    media_type = content_type if content_type in ("image/jpeg", "image/png") else "image/jpeg"

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=1500,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": VISION_PARSE_PROMPT},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{media_type};base64,{b64_image}"}
                    },
                ],
            }
        ],
    )

    response_text = response.choices[0].message.content.strip()
    if "```" in response_text:
        response_text = response_text.split("```")[1]
        if response_text.startswith("json"):
            response_text = response_text[4:]

    return json.loads(response_text)


async def parse_with_openai(text: str) -> dict:
    """Kept for the /parse-text test endpoint — parses raw text instead of an image."""
    client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
    prompt = f"""Extract medicines from this prescription text and return ONLY valid JSON in this format:
{{
    "patient_name": "name or Unknown",
    "doctor_name": "name or Unknown",
    "medications": [
        {{"medicine_name": "...", "dosage": "...", "frequency": "...", "duration": "...", "instructions": "...", "times_per_day": 1, "confidence": 1.0}}
    ],
    "overall_confidence": 1.0
}}

Prescription text:
{text}"""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}],
    )
    response_text = response.choices[0].message.content.strip()
    if "```" in response_text:
        response_text = response_text.split("```")[1]
        if response_text.startswith("json"):
            response_text = response_text[4:]
    return json.loads(response_text)


async def process_prescription(image_bytes: bytes, content_type: str = "image/jpeg") -> PrescriptionResponse:
    """Agent 1 entry point — image in, structured (unsaved) CarePlan out."""
    try:
        parsed = await parse_with_vision(image_bytes, content_type)
    except Exception as e:
        return PrescriptionResponse(success=False, error=f"Parsing failed: {str(e)}")

    medications_raw = parsed.get("medications", [])
    if not medications_raw:
        return PrescriptionResponse(
            success=False,
            error="Could not extract any medicines from this image. Try a clearer photo."
        )

    safety_flag, safety_note = check_safety(medications_raw)
    medications = [MedicationItem(**med) for med in medications_raw]

    care_plan = CarePlan(
        patient_name=parsed.get("patient_name", "Unknown"),
        doctor_name=parsed.get("doctor_name", "Unknown"),
        medications=medications,
        safety_flag=safety_flag,
        safety_note=safety_note,
        overall_confidence=parsed.get("overall_confidence", 1.0),
    )

    return PrescriptionResponse(
        success=True,
        care_plan=care_plan,
        raw_text="",  # no separate OCR text anymore — vision model reads directly
        llm_used="openai-vision",
    )