from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.prescription import router as prescription_router
from app.routes.reminder import router as reminder_router
from app.routes.stock import router as stock_router
from app.routes.auth import router as auth_router
from app.database.connection import init_db
from app.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="India's first autonomous patient care agent system"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await init_db()
    print(f"🚀 {settings.APP_NAME} started successfully")

app.include_router(auth_router)
app.include_router(prescription_router)
app.include_router(reminder_router)
app.include_router(stock_router)

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