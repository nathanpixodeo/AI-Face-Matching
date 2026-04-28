from fastapi import APIRouter

from app.config import settings
from app.models.schemas import MatchRequest, MatchResponse
from app.utils.similarity import cosine_distance, distance_to_percent, is_match

router = APIRouter(tags=["matching"])


@router.post("/match", response_model=MatchResponse)
async def compare_embeddings(req: MatchRequest):
    distance = cosine_distance(req.embedding1, req.embedding2)
    threshold = settings.match_threshold

    return MatchResponse(
        distance=round(distance, 6),
        similarity_percent=distance_to_percent(distance, threshold),
        is_match=is_match(distance, threshold),
        threshold=threshold,
    )
