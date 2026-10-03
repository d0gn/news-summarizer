from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.entities import FeedSource
from app.models.schemas import IngestionResultResponse
from app.services.pipeline import (
    run_pipeline_all_active_sources,
    run_pipeline_for_source,
)

router = APIRouter(prefix="/ingestion", tags=["Data Ingestion"])


@router.post("/trigger", response_model=IngestionResultResponse)
async def trigger_ingestion(
    source_id: Optional[int] = None, db: AsyncSession = Depends(get_db)
):
    """Triggers the data ingestion pipeline manually for all active sources or a specific source ID."""
    if source_id is not None:
        source = await db.get(FeedSource, source_id)
        if not source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Feed source not found.",
            )
        summary = await run_pipeline_for_source(db, source)
        summaries = [summary]
    else:
        summaries = await run_pipeline_all_active_sources(db)

    total_saved = sum(s.new_articles_saved for s in summaries)
    total_duplicates = sum(s.skipped_duplicates for s in summaries)
    total_skipped = sum(s.skipped_short_content + s.errors for s in summaries)

    return IngestionResultResponse(
        status="success",
        processed_sources=len(summaries),
        total_saved=total_saved,
        total_duplicates=total_duplicates,
        total_skipped=total_skipped,
        details=summaries,
    )
