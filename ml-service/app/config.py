from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    model_dir: Path = Path("/app/models")
    adaface_model_name: str = "ir_101"
    deepface_detector: str = "retinaface"
    deepface_model: str = "Facenet512"
    embedding_dim: int = 512
    detection_confidence: float = 0.9
    match_threshold: float = 0.4
    max_image_size: int = 1920
    log_level: str = "info"

    model_config = {"env_prefix": "ML_"}


settings = Settings()
settings.model_dir.mkdir(parents=True, exist_ok=True)
