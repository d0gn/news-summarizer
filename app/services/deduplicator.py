import hashlib
import urllib.parse
from typing import Set
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import Article

# Common tracking / analytics query parameters to strip
TRACKING_QUERY_PARAMS: Set[str] = {
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "utm_id",
    "fbclid",
    "gclid",
    "gclsrc",
    "dclid",
    "msclkid",
    "mc_cid",
    "mc_eid",
    "_hsenc",
    "_hsmi",
    "ref",
    "fref",
    "source",
}


def normalize_url(url: str) -> str:
    """Removes tracking query parameters, normalizes scheme/domain, and standardizes trailing slash."""
    if not url:
        return ""

    parsed = urllib.parse.urlsplit(url.strip())
    # Normalize scheme and netloc to lower case
    scheme = parsed.scheme.lower()
    netloc = parsed.netloc.lower()

    # Filter out tracking query parameters
    query_params = urllib.parse.parse_qsl(parsed.query, keep_blank_values=False)
    filtered_params = [
        (k, v) for k, v in query_params if k.lower() not in TRACKING_QUERY_PARAMS
    ]
    # Sort query params for deterministic canonical URL
    filtered_params.sort(key=lambda x: x[0])
    new_query = urllib.parse.urlencode(filtered_params)

    # Normalize path (remove trailing slash except for root path)
    path = parsed.path
    if path != "/" and path.endswith("/"):
        path = path.rstrip("/")

    # Reconstruct normalized URL (ignore fragment/anchor)
    normalized = urllib.parse.urlunsplit((scheme, netloc, path, new_query, ""))
    return normalized


def generate_url_hash(normalized_url: str) -> str:
    """Generates a 64-character SHA-256 hash of the normalized URL."""
    return hashlib.sha256(normalized_url.encode("utf-8")).hexdigest()


async def is_url_hash_duplicate(db: AsyncSession, url_hash: str) -> bool:
    """Checks whether the given URL hash already exists in the articles table."""
    stmt = select(Article.id).where(Article.origin_url_hash == url_hash).limit(1)
    result = await db.execute(stmt)
    return result.scalar_one_or_none() is not None
