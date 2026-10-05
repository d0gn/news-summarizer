from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.entities import Article, FeedSource, User, UserBookmark, UserPreference
from app.models.schemas import (
    ArticleResponse,
    BookmarkCreate,
    BookmarkResponse,
    UserPreferenceResponse,
    UserPreferenceUpdate,
)

router = APIRouter(prefix="/users", tags=["Users, Bookmarks & Personalized Feed"])


@router.post("/bookmarks", response_model=BookmarkResponse, status_code=status.HTTP_201_CREATED)
async def add_bookmark(
    body: BookmarkCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Adds an article to the current user's bookmarks."""
    article = await db.get(Article, body.article_id)
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found.")

    # Check if already bookmarked
    stmt = select(UserBookmark).where(
        UserBookmark.user_id == current_user.id,
        UserBookmark.article_id == body.article_id,
    )
    result = await db.execute(stmt)
    existing = result.scalars().first()
    if existing:
        return existing

    bookmark = UserBookmark(user_id=current_user.id, article_id=body.article_id)
    db.add(bookmark)
    await db.commit()
    await db.refresh(bookmark)
    
    # Ensure article relation is loaded
    await db.refresh(bookmark, ["article"])
    return bookmark


@router.delete("/bookmarks/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_bookmark(
    article_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Removes an article from the current user's bookmarks."""
    stmt = select(UserBookmark).where(
        UserBookmark.user_id == current_user.id,
        UserBookmark.article_id == article_id,
    )
    result = await db.execute(stmt)
    bookmark = result.scalars().first()
    if not bookmark:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bookmark not found.")

    await db.delete(bookmark)
    await db.commit()
    return None


@router.get("/bookmarks", response_model=List[BookmarkResponse])
async def list_bookmarks(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves paginated list of bookmarked articles for current user."""
    stmt = (
        select(UserBookmark)
        .options(selectinload(UserBookmark.article))
        .where(UserBookmark.user_id == current_user.id)
        .order_by(UserBookmark.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    bookmarks = result.scalars().all()
    return bookmarks


@router.get("/preferences", response_model=UserPreferenceResponse)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves current user's feed preferences."""
    stmt = select(UserPreference).where(UserPreference.user_id == current_user.id)
    result = await db.execute(stmt)
    pref = result.scalars().first()
    if not pref:
        # Return default empty preference
        return UserPreferenceResponse(
            user_id=current_user.id,
            preferred_categories=None,
            preferred_keywords=None,
            updated_at=current_user.created_at,
        )
    return pref


@router.put("/preferences", response_model=UserPreferenceResponse)
async def update_preferences(
    body: UserPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Updates or creates current user's feed preferences."""
    stmt = select(UserPreference).where(UserPreference.user_id == current_user.id)
    result = await db.execute(stmt)
    pref = result.scalars().first()

    if not pref:
        pref = UserPreference(
            user_id=current_user.id,
            preferred_categories=body.preferred_categories,
            preferred_keywords=body.preferred_keywords,
        )
        db.add(pref)
    else:
        if body.preferred_categories is not None:
            pref.preferred_categories = body.preferred_categories
        if body.preferred_keywords is not None:
            pref.preferred_keywords = body.preferred_keywords

    await db.commit()
    await db.refresh(pref)
    return pref


@router.get("/feed", response_model=List[ArticleResponse])
async def get_personalized_feed(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves personalized article feed based on user's preferred categories and keywords."""
    # Get user preferences
    pref_stmt = select(UserPreference).where(UserPreference.user_id == current_user.id)
    pref_res = await db.execute(pref_stmt)
    pref = pref_res.scalars().first()

    stmt = select(Article).order_by(Article.published_at.desc().nullslast(), Article.created_at.desc())

    if pref:
        conditions = []
        if pref.preferred_categories:
            categories = [c.strip() for c in pref.preferred_categories.split(",") if c.strip()]
            if categories:
                # Join with source to filter by category
                stmt = stmt.join(Article.source)
                conditions.append(FeedSource.category.in_(categories))

        if pref.preferred_keywords:
            keywords = [k.strip() for k in pref.preferred_keywords.split(",") if k.strip()]
            keyword_conditions = []
            for kw in keywords:
                keyword_conditions.append(Article.title.ilike(f"%{kw}%"))
                keyword_conditions.append(Article.tags.ilike(f"%{kw}%"))
            if keyword_conditions:
                conditions.append(or_(*keyword_conditions))

        if conditions:
            # If both category and keywords exist, filter with AND or OR. Let's use OR or combined filters.
            # For personalized feed, matching either preferred category or keywords is user-friendly.
            stmt = stmt.where(or_(*conditions))

    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    articles = result.scalars().all()
    return articles
