import pytest
from app.services.ai_summarizer import AISummarizerService


@pytest.mark.asyncio
async def test_ai_summarizer_fallback_without_api_key():
    # When api_key is empty/None, it should return the fallback dictionary without raising an exception
    service = AISummarizerService()
    service.api_key = ""
    service.client = None

    result = await service.summarize_article(
        title="테스트 기사 제목",
        content_text="테스트 기사 본문 내용입니다. 충분히 긴 본문으로 테스트를 진행합니다." * 5
    )

    assert "summary" in result
    assert "tags" in result
    assert "core_message" in result
    assert "API 키" in result["summary"]
