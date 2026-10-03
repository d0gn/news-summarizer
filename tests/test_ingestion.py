import pytest
from datetime import datetime

from app.services.deduplicator import normalize_url, generate_url_hash
from app.services.cleaner import clean_boilerplate_text, is_content_length_valid
from app.services.clusterer import calculate_jaccard_similarity


def test_normalize_url():
    # Test tracking parameter removal and trailing slash normalization
    url1 = "https://example.com/article/123/?utm_source=twitter&utm_medium=social&fbclid=12345&b=2&a=1"
    normalized1 = normalize_url(url1)
    assert normalized1 == "https://example.com/article/123?a=1&b=2"

    url2 = "HTTPS://EXAMPLE.COM/path/to/article/"
    normalized2 = normalize_url(url2)
    assert normalized2 == "https://example.com/path/to/article"


def test_generate_url_hash():
    norm_url = "https://example.com/news/1"
    hash1 = generate_url_hash(norm_url)
    hash2 = generate_url_hash(norm_url)
    assert len(hash1) == 64
    assert hash1 == hash2


def test_clean_boilerplate_text():
    raw = "안녕하세요. 뉴스 본문 내용입니다. [홍길동 기자 = reporter@news.com] 무단 전재 및 재배포 금지."
    cleaned = clean_boilerplate_text(raw)
    assert "reporter@news.com" not in cleaned
    assert "홍길동 기자" not in cleaned
    assert "무단 전재 및 재배포 금지" not in cleaned
    assert "뉴스 본문 내용입니다." in cleaned


def test_content_length_validity():
    short_text = "단순 이미지 뉴스입니다."
    assert is_content_length_valid(short_text, min_length=150) is False

    long_text = "이 문장은 뉴스 기사의 본문으로서 충분히 긴 길이를 가지고 있습니다. " * 10
    assert is_content_length_valid(long_text, min_length=150) is True


def test_jaccard_similarity():
    text1 = "OpenAI releases new powerful GPT-4o model for developers"
    text2 = "OpenAI releases new powerful GPT-4o model for developers and users"
    text3 = "Entirely unrelated topic about global stock markets and finance"

    sim_high = calculate_jaccard_similarity(text1, text2)
    sim_low = calculate_jaccard_similarity(text1, text3)

    assert sim_high > 0.7
    assert sim_low < 0.3
