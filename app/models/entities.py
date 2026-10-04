from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class FeedSource(Base):
    __tablename__ = "feed_sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    url: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="일반")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_crawled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    articles: Mapped[List["Article"]] = relationship(
        "Article", back_populates="source", cascade="all, delete-orphan"
    )


class TopicCluster(Base):
    __tablename__ = "topic_clusters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    primary_article_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    articles: Mapped[List["Article"]] = relationship(
        "Article", back_populates="cluster", foreign_keys="Article.cluster_id"
    )


class Article(Base):
    __tablename__ = "articles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("feed_sources.id", ondelete="SET NULL"), nullable=True
    )
    cluster_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("topic_clusters.id", ondelete="SET NULL"), nullable=True, index=True
    )

    origin_url: Mapped[str] = mapped_column(Text, nullable=False)
    normalized_url: Mapped[str] = mapped_column(Text, nullable=False)
    origin_url_hash: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    publisher: Mapped[str] = mapped_column(String(100), nullable=False)
    content_text: Mapped[str] = mapped_column(Text, nullable=False)
    content_html: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # AI Processing & Intelligence Fields (AI 가공 결과 캐싱용 필드)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="3줄 요약 결과")
    tags: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="태그 목록 (쉼표 구분 또는 JSON 배열)")
    core_message: Mapped[Optional[str]] = mapped_column(String(300), nullable=True, comment="한 줄 핵심 메시지")
    is_processed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, comment="AI 가공 완료 여부 플래그")

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    source: Mapped[Optional[FeedSource]] = relationship(
        "FeedSource", back_populates="articles"
    )
    cluster: Mapped[Optional[TopicCluster]] = relationship(
        "TopicCluster", back_populates="articles", foreign_keys=[cluster_id]
    )


__table_args__ = (
    Index("ix_articles_published_at", Article.published_at),
)
