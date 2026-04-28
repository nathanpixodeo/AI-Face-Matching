from pydantic import BaseModel
from typing import Optional


class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float


class DetectedFace(BaseModel):
    bbox: BoundingBox
    confidence: float
    embedding: Optional[list[float]] = None
    gender: Optional[str] = None
    gender_confidence: Optional[float] = None
    age: Optional[float] = None
    quality_score: Optional[float] = None
    model_used: str = "adaface"


class DetectResponse(BaseModel):
    faces_count: int
    faces: list[DetectedFace]


class EmbedResponse(BaseModel):
    faces_count: int
    embeddings: list[list[float]]
    model_used: str


class AnalyzeResponse(BaseModel):
    faces_count: int
    faces: list[DetectedFace]
    model_used: str


class BatchEmbedItem(BaseModel):
    index: int
    faces_count: int
    faces: list[DetectedFace]
    error: Optional[str] = None


class BatchEmbedResponse(BaseModel):
    total: int
    processed: int
    failed: int
    results: list[BatchEmbedItem]


class MatchRequest(BaseModel):
    embedding1: list[float]
    embedding2: list[float]


class MatchResponse(BaseModel):
    distance: float
    similarity_percent: float
    is_match: bool
    threshold: float


class HealthResponse(BaseModel):
    status: str
    models_loaded: dict[str, bool]
    version: str = "1.0.0"
