from app.models.schemas import (
    BoundingBox,
    DetectedFace,
    MatchRequest,
)


def test_bounding_box_creation():
    bbox = BoundingBox(x=10, y=20, width=100, height=100)
    assert bbox.x == 10
    assert bbox.width == 100


def test_detected_face():
    face = DetectedFace(
        bbox=BoundingBox(x=0, y=0, width=100, height=100),
        confidence=0.99,
    )
    assert face.confidence == 0.99
    assert face.bbox.x == 0


def test_match_request_validation():
    emb1 = [0.1] * 512
    emb2 = [0.2] * 512
    req = MatchRequest(embedding1=emb1, embedding2=emb2)
    assert len(req.embedding1) == 512
    assert len(req.embedding2) == 512
