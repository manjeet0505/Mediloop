from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.prescription import router as prescription_router

app = FastAPI(
    title="MedLoop AI",
    version="1.0.0",
    description="India's first autonomous patient care agent system"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prescription_router)

@app.get("/")
async def root():
    return {
        "app": "MedLoop AI",
        "version": "1.0.0",
        "status": "running",
        "agents": ["prescription", "adherence", "stock", "health", "followup"]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}