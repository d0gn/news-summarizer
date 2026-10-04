from dataclasses import dataclass, field
from datetime import datetime
import logging
from typing import List, Optional, Tuple
import feedparser
from bs4 import BeautifulSoup
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class RawArticleData:
    origin_url: str
    title: str
    publisher: str
    published_at: Optional[datetime] = None
    thumbnail_url: Optional[str] = None
    content_html: Optional[str] = None


async def fetch_rss_feed(source_url: str) -> List[dict]:
    """Asynchronously fetches and parses an RSS feed using httpx and feedparser."""
    headers = {"User-Agent": settings.INGESTION_USER_AGENT}
    try:
        async with httpx.AsyncClient(timeout=settings.INGESTION_REQUEST_TIMEOUT_SECONDS, follow_redirects=True) as client:
            response = await client.get(source_url, headers=headers)
            response.raise_for_status()
            content = response.text

        # Parse RSS feed content
        parsed_feed = feedparser.parse(content)
        if parsed_feed.bozo and not parsed_feed.entries:
            logger.warning(f"Failed to parse RSS feed correctly for URL: {source_url}, error: {parsed_feed.bozo_exception}")
            return []

        entries = []
        for entry in parsed_feed.entries:
            link = getattr(entry, "link", None)
            title = getattr(entry, "title", None)
            if not link or not title:
                continue

            # Extract published time if available
            published_at = None
            published_parsed = getattr(entry, "published_parsed", None) or getattr(entry, "updated_parsed", None)
            if published_parsed:
                try:
                    published_at = datetime(*published_parsed[:6])
                except Exception:
                    pass

            # Extract thumbnail from media or enclosures if present in RSS
            thumbnail_url = None
            if hasattr(entry, "media_content") and entry.media_content:
                for media in entry.media_content:
                    if "url" in media:
                        thumbnail_url = media["url"]
                        break
            elif hasattr(entry, "enclosures") and entry.enclosures:
                for enc in entry.enclosures:
                    if enc.get("type", "").startswith("image/"):
                        thumbnail_url = enc.get("href")
                        break

            # Extract summary or description from RSS entry as fallback content
            summary = getattr(entry, "summary", "") or getattr(entry, "description", "")

            entries.append({
                "link": link.strip(),
                "title": title.strip(),
                "published_at": published_at,
                "thumbnail_url": thumbnail_url,
                "summary": summary.strip(),
            })

        return entries
    except Exception as e:
        logger.error(f"Error fetching RSS feed {source_url}: {str(e)}")
        return []


async def fetch_article_webpage(url: str) -> Tuple[Optional[str], Optional[str]]:
    """Fetches article webpage HTML and extracts OpenGraph thumbnail if missing from RSS."""
    headers = {
        "User-Agent": settings.INGESTION_USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    }
    try:
        async with httpx.AsyncClient(timeout=settings.INGESTION_REQUEST_TIMEOUT_SECONDS, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            html_content = response.text

        soup = BeautifulSoup(html_content, "html.parser")
        
        # Extract OpenGraph or Twitter image as fallback thumbnail
        og_image = None
        og_image_tag = soup.find("meta", property="og:image") or soup.find("meta", attrs={"name": "twitter:image"})
        if og_image_tag and og_image_tag.get("content"):
            og_image = og_image_tag["content"].strip()

        return html_content, og_image
    except Exception as e:
        logger.warning(f"Failed to fetch article webpage {url}: {str(e)}")
        return None, None
