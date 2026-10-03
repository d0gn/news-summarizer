import re
from typing import Optional, Tuple
import trafilatura

from app.core.config import settings

# Boilerplate patterns for Korean and English news articles
BOILERPLATE_PATTERNS = [
    # Reporter email patterns: e.g. reporter@news.com
    re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", re.IGNORECASE),
    # Korean reporter bylines: e.g. [홍길동 기자 = ...], 홍길동 기자, 아무개 특파원
    re.compile(r"\[[가-힣a-zA-Z\s]+기자\]"),
    re.compile(r"\([가-힣a-zA-Z\s]+기자\)"),
    re.compile(r"[가-힣]{2,4}\s*(기자|특파원|인턴기자|논설위원|연구원)\b"),
    # Copyright & redistribution warning
    re.compile(
        r"(무단\s*전재\s*및\s*재배포\s*금지|무단전재\s*-\s*재배포\s*금지|AI\s*학습\s*이용\s*금지)",
        re.IGNORECASE,
    ),
    re.compile(r"저작권자\s*(ⓒ|\(c\)|©)?\s*[^\n]+", re.IGNORECASE),
    re.compile(r"Copyrights?\s*(©|\(c\))?[\s\w\.,\d\(\)]+All\s*rights\s*reserved\.?", re.IGNORECASE),
    re.compile(r"All\s*rights\s*reserved\.?", re.IGNORECASE),
    # Image/Graphic credits: e.g. [사진=연합뉴스], (사진=...)
    re.compile(r"[\[\(](사진|출처|자료|그래픽)\s*=\s*[^\]\)]+[\]\)]"),
    # Social/subscription promotions: e.g. 네이버 채널 구독, 카카오톡 제보
    re.compile(r"(네이버|다음|카카오톡)\s*(채널\s*)?(구독|제보)[^\n]*", re.IGNORECASE),
]


def clean_boilerplate_text(text: str) -> str:
    """Removes reporter bylines, emails, copyright notices, and excessive whitespace."""
    if not text:
        return ""

    cleaned = text
    for pattern in BOILERPLATE_PATTERNS:
        cleaned = pattern.sub("", cleaned)

    # Normalize excessive newlines and whitespace
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    cleaned = re.sub(r"\n\s*\n+", "\n\n", cleaned)
    return cleaned.strip()


def extract_article_content(
    html_content: str, source_url: Optional[str] = None
) -> Tuple[str, Optional[str]]:
    """Extracts clean plain text and clean HTML content from raw HTML using Trafilatura.

    Returns:
        Tuple of (clean_text, clean_html)
    """
    if not html_content or not html_content.strip():
        return "", None

    # Extract plain text
    raw_text = trafilatura.extract(
        html_content,
        url=source_url,
        include_comments=False,
        include_tables=False,
        include_images=False,
        include_links=False,
        no_fallback=False,
    )

    if not raw_text:
        return "", None

    cleaned_text = clean_boilerplate_text(raw_text)

    # Extract clean formatted HTML (optional structured layout)
    extracted_html = trafilatura.extract(
        html_content,
        url=source_url,
        output_format="html",
        include_comments=False,
        include_tables=False,
        no_fallback=False,
    )

    return cleaned_text, extracted_html


def is_content_length_valid(
    text: str, min_length: Optional[int] = None
) -> bool:
    """Validates whether the cleaned text meets the minimum character length requirement.

    Default minimum length is read from settings.MIN_ARTICLE_CONTENT_LENGTH (150 chars).
    """
    if not text:
        return False

    threshold = min_length if min_length is not None else settings.MIN_ARTICLE_CONTENT_LENGTH
    # We count non-whitespace characters to prevent bypass with whitespaces
    non_ws_count = len(re.sub(r"\s+", "", text))
    return non_ws_count >= threshold
