from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "MedLoop AI"
    VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    DATABASE_URL: str = ""
    UPSTASH_REDIS_REST_URL: str = ""
    UPSTASH_REDIS_REST_TOKEN: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
