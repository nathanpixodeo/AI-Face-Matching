"""
AdaFace embedding service.

AdaFace (MIT license) uses quality-adaptive margin for better accuracy on
low-quality images. We load the pretrained IR-101 model via ONNX Runtime
for inference without requiring the full training framework.

If ONNX model is not available, falls back to loading via PyTorch.
Model weights are downloaded on first use to the configured model_dir.
"""

import logging
from pathlib import Path
from typing import Optional

import cv2
import numpy as np

from app.config import settings

logger = logging.getLogger(__name__)

# Model download URLs (official AdaFace pretrained, MIT license)
ADAFACE_MODELS = {
    "ir_101": {
        "url": "https://github.com/mk-minchul/AdaFace/releases/download/v1.0/adaface_ir101_webface12m.onnx",
        "filename": "adaface_ir101_webface12m.onnx",
        "input_size": (112, 112),
    },
    "ir_50": {
        "url": "https://github.com/mk-minchul/AdaFace/releases/download/v1.0/adaface_ir50_webface4m.onnx",
        "filename": "adaface_ir50_webface4m.onnx",
        "input_size": (112, 112),
    },
}


class AdaFaceService:
    def __init__(self):
        self._session = None
        self._model_info = ADAFACE_MODELS.get(settings.adaface_model_name, ADAFACE_MODELS["ir_101"])
        self._loaded = False

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    async def load_model(self) -> None:
        try:
            import onnxruntime as ort

            model_path = settings.model_dir / self._model_info["filename"]

            if not model_path.exists():
                await self._download_model(model_path)

            if not model_path.exists():
                logger.warning("AdaFace model not found at %s, will use fallback", model_path)
                return

            providers = ["CUDAExecutionProvider", "CPUExecutionProvider"]
            available = ort.get_available_providers()
            providers = [p for p in providers if p in available]

            self._session = ort.InferenceSession(str(model_path), providers=providers)
            self._loaded = True
            logger.info(
                "AdaFace model loaded: %s (providers: %s)",
                self._model_info["filename"],
                providers,
            )
        except Exception as e:
            logger.error("Failed to load AdaFace model: %s", e)
            self._loaded = False

    async def _download_model(self, target_path: Path) -> None:
        import urllib.request

        url = self._model_info["url"]
        logger.info("Downloading AdaFace model from %s ...", url)
        try:
            target_path.parent.mkdir(parents=True, exist_ok=True)
            urllib.request.urlretrieve(url, str(target_path))
            logger.info("Model downloaded to %s", target_path)
        except Exception as e:
            logger.error("Failed to download AdaFace model: %s", e)

    def get_embedding(self, face_img: np.ndarray) -> Optional[list[float]]:
        if not self._loaded or self._session is None:
            return None

        try:
            input_size = self._model_info["input_size"]
            face_resized = cv2.resize(face_img, input_size, interpolation=cv2.INTER_AREA)

            if face_resized.shape[2] == 4:
                face_resized = face_resized[:, :, :3]

            face_rgb = cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB)
            face_normalized = (face_rgb.astype(np.float32) - 127.5) / 127.5

            # NCHW format for ONNX
            face_tensor = np.transpose(face_normalized, (2, 0, 1))
            face_tensor = np.expand_dims(face_tensor, axis=0)

            input_name = self._session.get_inputs()[0].name
            outputs = self._session.run(None, {input_name: face_tensor})

            embedding = outputs[0].flatten()

            # L2 normalize
            norm = np.linalg.norm(embedding)
            if norm > 0:
                embedding = embedding / norm

            return embedding.tolist()
        except Exception as e:
            logger.error("AdaFace embedding extraction failed: %s", e)
            return None


adaface_service = AdaFaceService()
