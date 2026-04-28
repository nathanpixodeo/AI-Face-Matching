import cv2
import numpy as np
from PIL import Image
import io

from app.config import settings


def load_image_from_bytes(data: bytes) -> np.ndarray:
    nparr = np.frombuffer(data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Failed to decode image")
    return img


def resize_if_needed(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    max_dim = settings.max_image_size
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    return img


def align_face(img: np.ndarray, landmarks: dict) -> np.ndarray:
    left_eye = np.array(landmarks.get("left_eye", [0, 0]), dtype=np.float32)
    right_eye = np.array(landmarks.get("right_eye", [0, 0]), dtype=np.float32)

    dy = right_eye[1] - left_eye[1]
    dx = right_eye[0] - left_eye[0]
    angle = np.degrees(np.arctan2(dy, dx))

    eye_center = ((left_eye[0] + right_eye[0]) / 2, (left_eye[1] + right_eye[1]) / 2)
    h, w = img.shape[:2]
    M = cv2.getRotationMatrix2D(eye_center, angle, 1.0)
    aligned = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC)
    return aligned


def crop_face(img: np.ndarray, bbox: dict, margin: float = 0.2) -> np.ndarray:
    h, w = img.shape[:2]
    x1 = int(bbox["x"])
    y1 = int(bbox["y"])
    x2 = int(bbox["x"] + bbox["width"])
    y2 = int(bbox["y"] + bbox["height"])

    margin_w = int(bbox["width"] * margin)
    margin_h = int(bbox["height"] * margin)

    x1 = max(0, x1 - margin_w)
    y1 = max(0, y1 - margin_h)
    x2 = min(w, x2 + margin_w)
    y2 = min(h, y2 + margin_h)

    return img[y1:y2, x1:x2]


def preprocess_face_for_model(face_img: np.ndarray, target_size: tuple = (112, 112)) -> np.ndarray:
    face_resized = cv2.resize(face_img, target_size, interpolation=cv2.INTER_AREA)
    face_rgb = cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB)
    face_normalized = (face_rgb.astype(np.float32) - 127.5) / 127.5
    return face_normalized


def calculate_image_quality(face_img: np.ndarray) -> float:
    gray = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    h, w = face_img.shape[:2]
    resolution_score = min(1.0, (h * w) / (112 * 112))
    brightness = gray.mean() / 255.0
    brightness_score = 1.0 - abs(brightness - 0.5) * 2
    quality = (laplacian_var / 500.0) * 0.4 + resolution_score * 0.3 + brightness_score * 0.3
    return round(min(1.0, max(0.0, quality)), 3)
