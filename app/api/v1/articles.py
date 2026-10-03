from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.entities import Article, FeedSource, TopicCluster
from app.models.schemas import (
    ArticleDetailResponse,
    ArticleResponse,
    RelatedArticleItem,
    TopicClusterResponse,
)

router = APIRouter(prefix="/articles", tags=["Articles & Feeds"])


@router.get("", response_model=List[ArticleResponse])
async def list_articles(
    skip: int = Query(0, ge=0, description="건너뛸 개수"),
    limit: int = Query(20, ge=1, le=100, description="조회할 개수"),
    category: Optional[str] = Query(None, description="카테고리 필터"),
    search: Optional[str] = Query(None, description="검색어 (제목/본문)"),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves paginated list of collected articles with optional category and search filters."""
    stmt = select(Article).order_by(Article.published_at.desc().nullslast(), Article.created_at.desc())

    if category:
        # Join with FeedSource to filter by category
        stmt = stmt.join(Article.source).where(FeedSource.category == category)

    if search:
        search_term = f"%{search}%"
        stmt = stmt.where(
            or_(
                Article.title.ilike(search_term),
                Article.content_text.ilike(search_term),
            )
        )

    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    articles = result.scalars().all()
    return articles


@router.get("/clusters", response_model=List[TopicClusterResponse])
async def list_topic_clusters(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves topic clusters along with their grouped articles."""
    stmt = (
        select(TopicCluster)
        .options(selectinload(TopicCluster.articles))
        .order_by(TopicCluster.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    clusters = result.scalars().all()

    response_data = []
    for cluster in clusters:
        cluster_dict = {
            "id": cluster.id,
            "title": cluster.title,
            "primary_article_id": cluster.primary_article_id,
            "created_at": cluster.created_at,
            "article_count": len(cluster.articles),
            "articles": cluster.articles,
        }
        response_data.append(cluster_dict)

    return response_data


@router.get("/{article_id}", response_model=ArticleDetailResponse)
async def get_article_detail(article_id: int, db: AsyncSession = Depends(get_db)):
    """Retrieves detailed information of a specific article including related articles in the same cluster."""
    article = await db.get(Article, article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Article not found.",
        )

    related_articles = []
    if article.cluster_id:
        stmt = (
            select(Article)
            .where(Article.cluster_id == article.cluster_id)
            .where(Article.id != article.id)
            .order_by(Article.published_at.desc())
        )
        res = await db.execute(stmt)
        related_articles = res.scalars().all()

    response_data = ArticleDetailResponse.model_validate(article)
    response_data.related_articles = [
        RelatedArticleItem.model_validate(ra) for ra in related_articles
    ]

    return response_data
