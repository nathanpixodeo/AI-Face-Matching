"""
Face service orchestrator.

Strategy: AdaFace (primary) + DeepFace (fallback).
Detection always uses DeepFace/RetinaFace.
Embedding: try AdaFace first, fall back to DeepFace Facenet512.
"""

import logging
from typing import Optional

import cv2
import numpy as np

from app.models.schemas import BoundingBox, DetectedFace
from app.services.adaface_service import adaface_service
from app.services.deepface_service import deepface_service
from app.utils.image import (
    crop_face,
    calculate_image_quality,
    load_image_from_bytes,
    resize_if_needed,
)

logger = logging.getLogger(__name__)


class FaceService:
    async def initialize(self) -> None:
        await adaface_service.load_model()
        await deepface_service.load_model()
        logger.info(
            "FaceService initialized — AdaFace: %s, DeepFace: %s",
            adaface_service.is_loaded,
            deepface_service.is_loaded,
        )

    def get_models_status(self) -> dict[str, bool]:
        return {
            "adaface": adaface_service.is_loaded,
            "deepface": deepface_service.is_loaded,
        }

    def detect_faces(self, image_bytes: bytes) -> list[dict]:
        img = load_image_from_bytes(image_bytes)
        img = resize_if_needed(img)
        return deepface_service.detect_faces(img)

    def analyze_image(self, image_bytes: bytes) -> list[DetectedFace]:
        img = load_image_from_bytes(image_bytes)
        img = resize_if_needed(img)

        raw_faces = deepface_service.detect_faces(img)
        if not raw_faces:
            return []

        results = []
        for face_data in raw_faces:
            bbox = face_data["bbox"]
            bbox_dict = {"x": bbox.x, "y": bbox.y, "width": bbox.width, "height": bbox.height}

            face_crop = crop_face(img, bbox_dict)
            if face_crop.size == 0:
                continue

            embedding, model_used = self._get_embedding_with_fallback(face_crop)
            if embedding is None:
                continue

            demographics = deepface_service.analyze_demographics(face_crop)
            quality = calculate_image_quality(face_crop)

            gender_raw = demographics.get("gender", "unknown")
            if gender_raw == "man":
                gender = "male"
            elif gender_raw == "woman":
                gender = "female"
            else:
                gender = "unknown"

            results.append(DetectedFace(
                bbox=bbox,
                confidence=face_data["confidence"],
                embedding=embedding,
                gender=gender,
                gender_confidence=demographics.get("gender_confidence"),
                age=demographics.get("age"),
                quality_score=quality,
                model_used=model_used,
            ))

        return results

    def extract_embeddings(self, image_bytes: bytes) -> tuple[list[list[float]], str]:
        img = load_image_from_bytes(image_bytes)
        img = resize_if_needed(img)

        raw_faces = deepface_service.detect_faces(img)
        if not raw_faces:
            return [], "none"

        embeddings = []
        model_used = "adaface"

        for face_data in raw_faces:
            bbox = face_data["bbox"]
            bbox_dict = {"x": bbox.x, "y": bbox.y, "width": bbox.width, "height": bbox.height}
            face_crop = crop_face(img, bbox_dict)
            if face_crop.size == 0:
                continue

            embedding, used = self._get_embedding_with_fallback(face_crop)
            if embedding:
                embeddings.append(embedding)
                model_used = used

        return embeddings, model_used

    def _get_embedding_with_fallback(
        self, face_img: np.ndarray
    ) -> tuple[Optional[list[float]], str]:
        if adaface_service.is_loaded:
            embedding = adaface_service.get_embedding(face_img)
            if embedding:
                return embedding, "adaface"
            logger.debug("AdaFace failed, trying DeepFace fallback")

        result = deepface_service.get_embedding_with_fallback(face_img)
        if result:
            return result

        return None, "none"


face_service = FaceService()
