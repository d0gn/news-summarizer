from fastapi import APIRouter
from app.api.v1 import articles, auth, ingestion, sources, users

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(sources.router)
api_router.include_router(ingestion.router)
api_router.include_router(articles.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
