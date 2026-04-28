"""
DeepFace fallback service (MIT license).

Uses DeepFace library with Facenet512 (primary) and ArcFace (secondary)
for face detection, embedding extraction, and age/gender analysis.
"""

import logging
from typing import Optional

import numpy as np

from app.config import settings
from app.models.schemas import BoundingBox

logger = logging.getLogger(__name__)


class DeepFaceService:
    def __init__(self):
        self._loaded = False
        self._models_warmed = set()

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    async def load_model(self) -> None:
        try:
            from deepface import DeepFace

            # Warm up primary model by running a dummy analysis
            dummy = np.zeros((112, 112, 3), dtype=np.uint8)
            try:
                DeepFace.represent(
                    dummy,
                    model_name="Facenet512",
                    detector_backend="skip",
                    enforce_detection=False,
                )
                self._models_warmed.add("Facenet512")
            except Exception:
                pass

            self._loaded = True
            logger.info("DeepFace service ready (Facenet512 + RetinaFace)")
        except Exception as e:
            logger.error("Failed to initialize DeepFace: %s", e)
            self._loaded = False

    def detect_faces(self, img: np.ndarray) -> list[dict]:
        if not self._loaded:
            return []

        try:
            from deepface import DeepFace

            results = DeepFace.extract_faces(
                img,
                detector_backend=settings.deepface_detector,
                enforce_detection=False,
                align=True,
            )

            faces = []
            for face_obj in results:
                if face_obj.get("confidence", 0) < settings.detection_confidence:
                    continue
                region = face_obj.get("facial_area", {})
                faces.append({
                    "bbox": BoundingBox(
                        x=region.get("x", 0),
                        y=region.get("y", 0),
                        width=region.get("w", 0),
                        height=region.get("h", 0),
                    ),
                    "confidence": face_obj.get("confidence", 0),
                    "face_img": face_obj.get("face"),
                    "landmarks": face_obj.get("landmarks", {}),
                })
            return faces
        except Exception as e:
            logger.error("DeepFace detection failed: %s", e)
            return []

    def get_embedding(
        self, img: np.ndarray, model_name: str = "Facenet512"
    ) -> Optional[list[float]]:
        if not self._loaded:
            return None

        try:
            from deepface import DeepFace

            results = DeepFace.represent(
                img,
                model_name=model_name,
                detector_backend="skip",
                enforce_detection=False,
                normalize_embedding=True,
            )

            if results and len(results) > 0:
                embedding = results[0].get("embedding", [])
                return embedding
            return None
        except Exception as e:
            logger.error("DeepFace embedding failed (%s): %s", model_name, e)
            return None

    def get_embedding_with_fallback(self, img: np.ndarray) -> Optional[tuple[list[float], str]]:
        embedding = self.get_embedding(img, "Facenet512")
        if embedding:
            return embedding, "deepface-facenet512"

        embedding = self.get_embedding(img, "ArcFace")
        if embedding:
            return embedding, "deepface-arcface"

        return None

    def analyze_demographics(self, img: np.ndarray) -> dict:
        try:
            from deepface import DeepFace

            results = DeepFace.analyze(
                img,
                actions=["age", "gender"],
                detector_backend="skip",
                enforce_detection=False,
                silent=True,
            )
            if results and len(results) > 0:
                result = results[0]
                gender_data = result.get("gender", {})
                dominant_gender = result.get("dominant_gender", "unknown").lower()
                gender_confidence = gender_data.get(
                    result.get("dominant_gender", ""), 0
                ) / 100.0
                return {
                    "gender": dominant_gender if dominant_gender in ("man", "woman") else "unknown",
                    "gender_confidence": round(gender_confidence, 3),
                    "age": result.get("age", 0),
                }
        except Exception as e:
            logger.error("DeepFace analysis failed: %s", e)

        return {"gender": "unknown", "gender_confidence": 0, "age": 0}


deepface_service = DeepFaceService()
