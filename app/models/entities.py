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
    bookmarks: Mapped[List["UserBookmark"]] = relationship(
        "UserBookmark", back_populates="article", cascade="all, delete-orphan"
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tier: Mapped[str] = mapped_column(String(50), nullable=False, default="free")  # free, pro, team
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    bookmarks: Mapped[List["UserBookmark"]] = relationship(
        "UserBookmark", back_populates="user", cascade="all, delete-orphan"
    )
    preference: Mapped[Optional["UserPreference"]] = relationship(
        "UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class UserBookmark(Base):
    __tablename__ = "user_bookmarks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    article_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("articles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="bookmarks")
    article: Mapped["Article"] = relationship("Article", back_populates="bookmarks")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    preferred_categories: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="쉼표로 구분된 선호 카테고리")
    preferred_keywords: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="쉼표로 구분된 선호 키워드/태그")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="preference")


__table_args__ = (
    Index("ix_articles_published_at", Article.published_at),
)
