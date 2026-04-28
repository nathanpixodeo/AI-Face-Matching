import numpy as np


def cosine_distance(emb1: list[float], emb2: list[float]) -> float:
    a = np.array(emb1, dtype=np.float32)
    b = np.array(emb2, dtype=np.float32)
    dot = np.dot(a, b)
    norm = np.linalg.norm(a) * np.linalg.norm(b)
    if norm == 0:
        return 1.0
    similarity = dot / norm
    return float(1.0 - similarity)


def distance_to_percent(distance: float, threshold: float = 0.4) -> float:
    if distance >= 1.0:
        return 0.0
    if distance <= 0.0:
        return 100.0
    if distance > threshold:
        linear = (1.0 - distance) / (2.0 * (1.0 - threshold))
        return round(linear * 100, 2)
    linear = 1.0 - (distance / (2.0 * threshold))
    boosted = linear + (1.0 - linear) * ((linear - 0.5) * 2) ** 0.2
    return round(min(100.0, boosted * 100), 2)


def is_match(distance: float, threshold: float = 0.4) -> bool:
    return distance < threshold
