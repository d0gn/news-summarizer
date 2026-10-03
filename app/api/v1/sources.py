from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.entities import FeedSource
from app.models.schemas import (
    FeedSourceCreate,
    FeedSourceResponse,
    FeedSourceUpdate,
)

router = APIRouter(prefix="/sources", tags=["Feed Sources"])


@router.get("", response_model=List[FeedSourceResponse])
async def list_feed_sources(db: AsyncSession = Depends(get_db)):
    """Retrieves all registered feed sources."""
    stmt = select(FeedSource).order_by(FeedSource.id.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=FeedSourceResponse, status_code=status.HTTP_201_CREATED)
async def create_feed_source(
    payload: FeedSourceCreate, db: AsyncSession = Depends(get_db)
):
    """Registers a new RSS feed source."""
    # Check if URL already exists
    stmt = select(FeedSource).where(FeedSource.url == payload.url)
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A feed source with this URL already exists.",
        )

    source = FeedSource(
        name=payload.name,
        url=payload.url,
        category=payload.category,
        is_active=payload.is_active,
    )
    db.add(source)
    await db.commit()
    await db.refresh(source)
    return source


@router.put("/{source_id}", response_model=FeedSourceResponse)
async def update_feed_source(
    source_id: int, payload: FeedSourceUpdate, db: AsyncSession = Depends(get_db)
):
    """Updates an existing feed source."""
    source = await db.get(FeedSource, source_id)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feed source not found.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(source, key, value)

    await db.commit()
    await db.refresh(source)
    return source


@router.delete("/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_feed_source(source_id: int, db: AsyncSession = Depends(get_db)):
    """Deletes a feed source."""
    source = await db.get(FeedSource, source_id)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feed source not found.",
        )

    await db.delete(source)
    await db.commit()
    return None
