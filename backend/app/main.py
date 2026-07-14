import logging
logging.basicConfig(level=logging.INFO)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.prescription import router as prescription_router
from app.routes.reminder import router as reminder_router
from app.routes.stock import router as stock_router
from app.routes.auth import router as auth_router
from app.database.connection import init_db
from app.services.scheduler import start_scheduler, stop_scheduler
from app.config import settings
from app.routes.patients import router as patients_router
from app.routes.patient import router as patient_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="India's first autonomous patient care agent system"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await init_db()
    start_scheduler()
    print(f"🚀 {settings.APP_NAME} started successfully")

@app.on_event("shutdown")
async def shutdown():
    stop_scheduler()

app.include_router(auth_router)
app.include_router(prescription_router)
app.include_router(reminder_router)
app.include_router(stock_router)
app.include_router(patients_router)
app.include_router(patient_router)

@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "running",
        "agents": ["prescription", "adherence", "stock", "health", "followup"]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}