import json
import logging
from typing import Dict, Any, Optional
from google import genai
from google.genai import types

from app.core.config import settings

logger = logging.getLogger(__name__)

class AISummarizerService:
    def __init__(self):
        # [사용자 설정 필요]: GEMINI_API_KEY가 환경변수나 설정에 올바르게 주입되었는지 확인하세요.
        # .env 파일에 GEMINI_API_KEY=your_key 를 입력하거나 아래 클라이언트 초기화 방식을 조정할 수 있습니다.
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = getattr(settings, "GEMINI_MODEL_NAME", "gemini-3.5-flash-lite")
        
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None
            logger.warning("GEMINI_API_KEY is not configured. AI summarizer will run in mock/dummy mode or fail.")

    async def summarize_article(self, title: str, content_text: str) -> Dict[str, Any]:
        """
        기사 제목과 본문을 받아 Gemini API를 통해 3줄 요약, 태그 목록, 한 줄 핵심을 추출합니다.
        프로젝트 규칙: Gemini API 응답은 반드시 사전에 정의된 JSON Schema 규격(3줄 요약, 태그 목록, 한 줄 핵심)을 준수합니다.
        """
        if not self.client or not self.api_key:
            # [사용자 작성/복사 영역]: API 키가 없을 때 반환할 기본 Mock 데이터 구조 (필요시 커스텀 가능)
            logger.error("Gemini client is not initialized due to missing API key.")
            return {
                "summary": "1. API 키가 설정되지 않아 요약을 생성할 수 없습니다.\n2. .env 파일에 GEMINI_API_KEY를 설정해주세요.\n3. 설정 후 다시 시도해주세요.",
                "tags": "설정오류, API키필요",
                "core_message": "GEMINI_API_KEY 설정이 필요합니다."
            }

        prompt = f"""
        다음 뉴스 기사를 분석하여 정확하고 간결한 JSON 형태로 응답해 주세요.

        [기사 제목]
        {title}

        [기사 본문]
        {content_text}

        [출력 요구사항]
        1. summary: 핵심 내용을 담은 3줄 요약 (줄바꿈 문장 형태로 작성)
        2. tags: 핵심 키워드 태그 목록 (쉼표로 구분된 문자열, 예: "인공지능,테크,스타트업")
        3. core_message: 기사의 핵심을 관통하는 한 줄 핵심 메시지
        """

        try:
            # [사용자 커스텀 영역]: Gemini API 호출 설정 (response_mime_type 및 response_schema 정의)
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema={
                        "type": "OBJECT",
                        "properties": {
                            "summary": {"type": "STRING", "description": "3줄 요약"},
                            "tags": {"type": "STRING", "description": "쉼표로 구분된 태그 목록"},
                            "core_message": {"type": "STRING", "description": "한 줄 핵심 메시지"}
                        },
                        "required": ["summary", "tags", "core_message"]
                    },
                    temperature=0.2,
                ),
            )

            result_data = json.loads(response.text)
            return {
                "summary": result_data.get("summary", ""),
                "tags": result_data.get("tags", ""),
                "core_message": result_data.get("core_message", "")
            }

        except Exception as e:
            logger.exception(f"Error during Gemini API summarization: {e}")
            # [사용자 예외 처리 영역]: API 호출 실패 시 폴백(Fallback) 로직 커스텀
            return {
                "summary": "AI 요약 생성 중 오류가 발생했습니다.",
                "tags": "오류,AI",
                "core_message": "요약 처리 실패"
            }

ai_summarizer_service = AISummarizerService()
