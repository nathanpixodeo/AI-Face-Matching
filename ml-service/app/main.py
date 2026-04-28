import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import settings
from app.models.schemas import HealthResponse
from app.routers import detect, embed, match
from app.services.face_service import face_service

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Loading ML models...")
    await face_service.initialize()
    logger.info("ML models ready")
    yield
    logger.info("Shutting down ML service")


app = FastAPI(
    title="AI Face Matching - ML Service",
    description="Face detection, embedding extraction, and matching using AdaFace + DeepFace",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(detect.router)
app.include_router(embed.router)
app.include_router(match.router)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        models_loaded=face_service.get_models_status(),
    )
