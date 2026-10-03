from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from sqlalchemy import select

from app.api.v1 import api_router
from app.core.database import async_session_factory, init_db
from app.models.entities import FeedSource
from app.services.scheduler import start_scheduler, shutdown_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize database tables
    await init_db()
    logger.info("Database tables initialized successfully.")

    # 2. Seed default feed sources if none exist
    async with async_session_factory() as db:
        stmt = select(FeedSource).limit(1)
        res = await db.execute(stmt)
        if res.scalar_one_or_none() is None:
            default_sources = [
                FeedSource(name="GeekNews", url="https://news.hada.io/rss", category="IT/테크", is_active=True),
                FeedSource(name="HackerNews", url="https://news.ycombinator.com/rss", category="IT/테크", is_active=True),
            ]
            db.add_all(default_sources)
            await db.commit()
            logger.info("Default feed sources seeded successfully.")

    # 3. Start background ingestion scheduler
    start_scheduler()

    yield

    # 4. Shutdown scheduler on app exit
    shutdown_scheduler()
    logger.info("Application shutdown complete.")


app = FastAPI(
    title="Personalized News Summarizer API",
    description="AI 기반 맞춤형 뉴스 요약 SaaS 플랫폼 백엔드 API (Data Ingestion & ETL)",
    version="0.1.0",
    lifespan=lifespan,
)

# Include API router
app.include_router(api_router)


@app.get("/", tags=["Health Check"])
def health_check():
    return {
        "status": "ok",
        "message": "Personalized News Summarizer API is running",
        "engine": "Data Ingestion & ETL Engine Active",
    }
