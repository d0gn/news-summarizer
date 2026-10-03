from fastapi import FastAPI

app = FastAPI(
    title="Personalized News Summarizer API",
    description="개인 맞춤형 뉴스 요약 서비스 백엔드 API",
    version="0.1.0",
)


@app.get("/", tags=["Health Check"])
def health_check():
    return {
        "status": "ok",
        "message": "Personalized News Summarizer API is running",
    }
