import pytest
from app.utils.similarity import cosine_distance, distance_to_percent, is_match


def test_cosine_distance_identical():
    vec = [1.0, 0.0, 0.0]
    assert cosine_distance(vec, vec) == pytest.approx(0.0, abs=1e-6)


def test_cosine_distance_orthogonal():
    a = [1.0, 0.0, 0.0]
    b = [0.0, 1.0, 0.0]
    assert cosine_distance(a, b) == pytest.approx(1.0, abs=1e-6)


def test_cosine_distance_opposite():
    a = [1.0, 0.0]
    b = [-1.0, 0.0]
    assert cosine_distance(a, b) == pytest.approx(2.0, abs=1e-6)


def test_distance_to_percent_zero():
    assert distance_to_percent(0.0) == 100.0


def test_distance_to_percent_high():
    pct = distance_to_percent(1.0)
    assert 0 <= pct <= 100


def test_is_match_below_threshold():
    assert is_match(0.3) is True


def test_is_match_above_threshold():
    assert is_match(0.5) is False


def test_is_match_custom_threshold():
    assert is_match(0.35, threshold=0.3) is False
    assert is_match(0.25, threshold=0.3) is True
