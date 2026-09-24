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
    whatsapp_access_token: str = ""
    whatsapp_phone_number_id: str = ""
    JWT_SECRET_KEY: str = ""
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = ""
    
    class Config:
        env_file = ".env"

settings = Settings()
