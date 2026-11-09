import asyncio
from dotenv import load_dotenv
load_dotenv(override=True)

from app.services.rag_service import index_prescription

async def main():
    await index_prescription(
        patient_id="test-connection",
        prescription_id="00000000-0000-0000-0000-000000000001",
        doctor_name="Connection Test",
        medications=[{"medicine_name": "Betaloc", "dosage": "100mg", "frequency": "daily"}],
        raw_text="",
        created_at=None,
    )
    print("Qdrant index OK")

asyncio.run(main())