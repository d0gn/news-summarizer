from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_ENV: str = "development"
    PORT: int = 8000
    DATABASE_URL: str = "sqlite+aiosqlite:///./news_summarizer.db"

    # Ingestion & Scraping Settings
    INGESTION_INTERVAL_MINUTES: int = 15
    INGESTION_REQUEST_TIMEOUT_SECONDS: float = 10.0
    MAX_ITEMS_PER_FEED: int = Field(default=20, description="Maximum number of items to process per feed during ingestion")
    INGESTION_USER_AGENT: str = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36 (NewsSummarizerBot/1.0)"
    )

    # Content Cleaning Settings
    MIN_ARTICLE_CONTENT_LENGTH: int = 150

    # Clustering Settings
    TOPIC_SIMILARITY_THRESHOLD: float = 0.85
    CLUSTERING_LOOKBACK_HOURS: int = 24

    # AI / Gemini Settings (사용자가 본인 환경에 맞게 .env에 설정하거나 아래 기본값을 수정할 수 있습니다)
    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API Key")
    GEMINI_MODEL_NAME: str = Field(default="gemini-3.5-flash-lite", description="Gemini model to use for summarization")



settings = Settings()
