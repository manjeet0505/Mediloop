from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings
import ssl
import re

def get_async_url(url: str) -> str:
    url = re.sub(r'^postgresql://', 'postgresql+asyncpg://', url)
    url = re.sub(r'^postgres://', 'postgresql+asyncpg://', url)
    url = re.sub(r'\?.*$', '', url)  # Remove ALL query params
    return url

ASYNC_DATABASE_URL = get_async_url(settings.DATABASE_URL)

ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=True,
    connect_args={"ssl": ssl_context},
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables created successfully")