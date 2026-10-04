from datetime import datetime
import logging
from typing import Dict, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import Article, FeedSource
from app.models.schemas import IngestionSummary
from app.services.cleaner import extract_article_content, is_content_length_valid
from app.services.clusterer import assign_article_to_cluster
from app.services.deduplicator import (
    generate_url_hash,
    is_url_hash_duplicate,
    normalize_url,
)
from app.services.scraper import fetch_article_webpage, fetch_rss_feed
from app.services.ai_summarizer import ai_summarizer_service
from app.core.config import settings

logger = logging.getLogger(__name__)


async def run_pipeline_for_source(db: AsyncSession, source: FeedSource) -> IngestionSummary:
    """Runs the complete ingestion, cleaning, deduplication, and clustering pipeline for a single FeedSource."""
    summary = IngestionSummary(
        source_id=source.id,
        source_name=source.name,
    )

    feed_entries = await fetch_rss_feed(source.url)
    summary.total_feed_items = len(feed_entries)

    # Limit feed entries processed per run according to settings
    feed_entries = feed_entries[:settings.MAX_ITEMS_PER_FEED]

    for entry in feed_entries:
        try:
            raw_url = entry["link"]
            title = entry["title"]
            rss_thumbnail = entry.get("thumbnail_url")
            published_at = entry.get("published_at")
            rss_summary = entry.get("summary", "")

            # 1. Strict Deduplication (URL normalization + hash check)
            norm_url = normalize_url(raw_url)
            if not norm_url:
                summary.errors += 1
                continue

            url_hash = generate_url_hash(norm_url)
            if await is_url_hash_duplicate(db, url_hash):
                summary.skipped_duplicates += 1
                continue

            # 2. Fetch article webpage content & fallback OpenGraph thumbnail
            html_content, og_thumbnail = await fetch_article_webpage(raw_url)
            
            # Fallback to RSS summary if webpage fetch failed (e.g. 403 Forbidden / Anti-bot block)
            if not html_content and rss_summary:
                html_content = rss_summary
                logger.info(f"Using RSS summary fallback for blocked/failed URL: {raw_url}")

            if not html_content:
                summary.errors += 1
                continue

            # 3. Clean content & boilerplate removal
            clean_text, clean_html = extract_article_content(html_content, source_url=raw_url)

            # 4. Content length validation (>= 150 chars)
            if not is_content_length_valid(clean_text):
                summary.skipped_short_content += 1
                continue

            thumbnail_url = rss_thumbnail or og_thumbnail

            # 5. AI Processing & Summarization (Gemini API)
            ai_result = await ai_summarizer_service.summarize_article(title, clean_text)

            # 6. Create Article entity
            article = Article(
                source_id=source.id,
                origin_url=raw_url,
                normalized_url=norm_url,
                origin_url_hash=url_hash,
                title=title,
                publisher=source.name,
                content_text=clean_text,
                content_html=clean_html,
                thumbnail_url=thumbnail_url,
                published_at=published_at or datetime.utcnow(),
                is_primary=False,
                summary=ai_result.get("summary"),
                tags=ai_result.get("tags"),
                core_message=ai_result.get("core_message"),
                is_processed=True,
            )
            db.add(article)
            await db.flush()

            # 7. Topic Clustering & Primary Article Assignment
            await assign_article_to_cluster(db, article)

            summary.new_articles_saved += 1
            summary.clusters_created_or_joined += 1

        except Exception as e:
            logger.error(f"Error processing feed entry {entry.get('link', 'unknown')} from source {source.name}: {str(e)}")
            summary.errors += 1

    # Update source last crawled timestamp
    source.last_crawled_at = datetime.utcnow()
    await db.flush()

    return summary


async def run_pipeline_all_active_sources(db: AsyncSession) -> List[IngestionSummary]:
    """Runs the ingestion pipeline for all active FeedSources in the database."""
    stmt = select(FeedSource).where(FeedSource.is_active == True)
    result = await db.execute(stmt)
    sources = result.scalars().all()

    summaries = []
    for source in sources:
        summary = await run_pipeline_for_source(db, source)
        summaries.append(summary)

    return summaries
