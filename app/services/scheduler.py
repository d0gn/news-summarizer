import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import async_session_factory
from app.services.pipeline import run_pipeline_all_active_sources

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def scheduled_ingestion_job() -> None:
    """Scheduled background job that executes the ingestion pipeline for all active sources."""
    logger.info("Starting scheduled news ingestion job...")
    async with async_session_factory() as db:
        try:
            summaries = await run_pipeline_all_active_sources(db)
            total_saved = sum(s.new_articles_saved for s in summaries)
            logger.info(f"Scheduled ingestion completed. Total new articles saved: {total_saved}")
        except Exception as e:
            logger.error(f"Error during scheduled ingestion job: {str(e)}")


def start_scheduler() -> None:
    """Starts the APScheduler instance with configured interval."""
    if not scheduler.running:
        scheduler.add_job(
            scheduled_ingestion_job,
            "interval",
            minutes=settings.INGESTION_INTERVAL_MINUTES,
            id="news_ingestion_job",
            replace_existing=True,
        )
        scheduler.start()
        logger.info(f"Background ingestion scheduler started (Interval: {settings.INGESTION_INTERVAL_MINUTES} mins).")


def shutdown_scheduler() -> None:
    """Shuts down the APScheduler instance gracefully."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Background ingestion scheduler shut down.")
