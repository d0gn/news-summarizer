from datetime import datetime, timedelta
import re
from typing import List, Set, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.entities import Article, TopicCluster


def _tokenize_to_ngrams(text: str, n: int = 2) -> Set[str]:
    """Generates character/word n-grams for similarity comparison."""
    if not text:
        return set()
    # Normalize and remove punctuation/whitespace
    normalized = re.sub(r"[^\w\s]", "", text.lower())
    words = normalized.split()
    if not words:
        return set()

    ngrams = set()
    # Word n-grams
    for i in range(len(words) - n + 1):
        ngrams.add(" ".join(words[i : i + n]))
    
    # Fallback to single words if text is short
    if not ngrams:
        ngrams = set(words)

    return ngrams


def calculate_jaccard_similarity(text1: str, text2: str) -> float:
    """Calculates Jaccard similarity coefficient between two texts based on n-grams."""
    if not text1 or not text2:
        return 0.0

    set1 = _tokenize_to_ngrams(text1, n=2)
    set2 = _tokenize_to_ngrams(text2, n=2)

    if not set1 or not set2:
        return 0.0

    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))

    if union == 0:
        return 0.0

    return float(intersection) / float(union)


async def assign_article_to_cluster(db: AsyncSession, article: Article) -> None:
    """Finds or creates a TopicCluster for the incoming article based on similarity threshold (>= 0.85)."""
    cutoff_time = datetime.utcnow() - timedelta(hours=settings.CLUSTERING_LOOKBACK_HOURS)

    # Fetch recent clusters or articles within the lookback window
    stmt = (
        select(Article)
        .where(Article.created_at >= cutoff_time)
        .where(Article.cluster_id.is_not(None))
    )
    result = await db.execute(stmt)
    recent_articles = result.scalars().all()

    best_match_cluster_id: Optional[int] = None
    highest_similarity: float = 0.0

    # Compare title + snippet similarity
    article_signature = f"{article.title} {article.content_text[:300]}"

    for existing in recent_articles:
        existing_signature = f"{existing.title} {existing.content_text[:300]}"
        sim = calculate_jaccard_similarity(article_signature, existing_signature)

        if sim > highest_similarity:
            highest_similarity = sim
            best_match_cluster_id = existing.cluster_id

    if highest_similarity >= settings.TOPIC_SIMILARITY_THRESHOLD and best_match_cluster_id:
        # Assign to existing cluster
        article.cluster_id = best_match_cluster_id
        
        # Check if we should update primary article of the cluster
        cluster_stmt = select(TopicCluster).where(TopicCluster.id == best_match_cluster_id)
        cluster_res = await db.execute(cluster_stmt)
        cluster = cluster_res.scalar_one_or_none()

        if cluster:
            primary_stmt = select(Article).where(Article.id == cluster.primary_article_id)
            primary_res = await db.execute(primary_stmt)
            primary_article = primary_res.scalar_one_or_none()

            # If current article is longer/richer or newer, make it primary
            if not primary_article or len(article.content_text) > len(primary_article.content_text):
                if primary_article:
                    primary_article.is_primary = False
                cluster.primary_article_id = article.id
                article.is_primary = True
        
        await db.flush()
    else:
        # Create a new topic cluster
        new_cluster = TopicCluster(
            title=article.title,
            primary_article_id=None  # will update after flush
        )
        db.add(new_cluster)
        await db.flush()

        article.cluster_id = new_cluster.id
        article.is_primary = True
        new_cluster.primary_article_id = article.id
        await db.flush()
