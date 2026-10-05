from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class FeedSourceBase(BaseModel):
    name: str = Field(..., max_length=100, description="피드 제공 언론사/출처명")
    url: str = Field(..., max_length=500, description="RSS 또는 피드 엔드포인트 URL")
    category: str = Field(default="일반", max_length=50, description="카테고리")
    is_active: bool = Field(default=True, description="수집 활성화 여부")


class FeedSourceCreate(FeedSourceBase):
    pass


class FeedSourceUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    url: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


class FeedSourceResponse(FeedSourceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    last_crawled_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class ArticleBase(BaseModel):
    origin_url: str
    title: str
    publisher: str
    content_text: str
    thumbnail_url: Optional[str] = None
    published_at: Optional[datetime] = None
    is_primary: bool = False
    summary: Optional[str] = Field(None, description="3줄 요약")
    tags: Optional[str] = Field(None, description="태그 목록")
    core_message: Optional[str] = Field(None, description="한 줄 핵심")
    is_processed: bool = Field(default=False, description="AI 가공 완료 여부")


class RelatedArticleItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    publisher: str
    origin_url: str
    published_at: Optional[datetime] = None


class ArticleResponse(ArticleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source_id: Optional[int] = None
    cluster_id: Optional[int] = None
    created_at: datetime


class ArticleDetailResponse(ArticleResponse):
    content_html: Optional[str] = None
    related_articles: List[RelatedArticleItem] = []


class TopicClusterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    primary_article_id: Optional[int] = None
    created_at: datetime
    article_count: int = 0
    articles: List[ArticleResponse] = []


class IngestionSummary(BaseModel):
    source_id: int
    source_name: str
    total_feed_items: int = 0
    new_articles_saved: int = 0
    skipped_duplicates: int = 0
    skipped_short_content: int = 0
    errors: int = 0
    clusters_created_or_joined: int = 0


class IngestionResultResponse(BaseModel):
    status: str
    processed_sources: int
    total_saved: int
    total_duplicates: int
    total_skipped: int
    details: List[IngestionSummary]


# User & Auth Schemas
class UserCreate(BaseModel):
    email: str = Field(..., description="사용자 이메일")
    password: str = Field(..., min_length=6, description="비밀번호 (최소 6자)")
    full_name: Optional[str] = Field(None, max_length=100, description="사용자 이름")


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: Optional[str] = None
    tier: str = "free"
    is_active: bool = True
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Bookmark & Preference Schemas
class BookmarkCreate(BaseModel):
    article_id: int = Field(..., description="북마크할 기사 ID")


class BookmarkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    article_id: int
    created_at: datetime
    article: ArticleResponse


class UserPreferenceUpdate(BaseModel):
    preferred_categories: Optional[str] = Field(None, description="쉼표로 구분된 선호 카테고리 (예: IT,경제)")
    preferred_keywords: Optional[str] = Field(None, description="쉼표로 구분된 선호 키워드 (예: 인공지능,반도체)")


class UserPreferenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    preferred_categories: Optional[str] = None
    preferred_keywords: Optional[str] = None
    updated_at: datetime
