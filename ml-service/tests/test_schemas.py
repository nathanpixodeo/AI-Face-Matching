import pytest
from app.models.schemas import (
    BoundingBox,
    DetectedFace,
    MatchRequest,
)


def test_bounding_box_creation():
    bbox = BoundingBox(x1=10, y1=20, x2=110, y2=120)
    assert bbox.x1 == 10
    assert bbox.x2 == 110


def test_detected_face():
    face = DetectedFace(
        bbox=BoundingBox(x1=0, y1=0, x2=100, y2=100),
        confidence=0.99,
    )
    assert face.confidence == 0.99
    assert face.bbox.x1 == 0


def test_match_request_validation():
    emb1 = [0.1] * 512
    emb2 = [0.2] * 512
    req = MatchRequest(embedding1=emb1, embedding2=emb2)
    assert len(req.embedding1) == 512
    assert len(req.embedding2) == 512
