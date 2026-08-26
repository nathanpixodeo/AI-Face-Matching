import logging
from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models.schemas import (
    AnalyzeResponse,
    BatchEmbedItem,
    BatchEmbedResponse,
    EmbedResponse,
)
from app.services.face_service import face_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["embedding"])


@router.post("/embed", response_model=EmbedResponse)
async def extract_embeddings(file: Annotated[UploadFile, File(...)]):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")

    image_bytes = await file.read()
    embeddings, model_used = face_service.extract_embeddings(image_bytes)

    return EmbedResponse(
        faces_count=len(embeddings),
        embeddings=embeddings,
        model_used=model_used,
    )


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_faces(file: Annotated[UploadFile, File(...)]):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")

    image_bytes = await file.read()
    faces = face_service.analyze_image(image_bytes)

    model = faces[0].model_used if faces else "none"
    return AnalyzeResponse(faces_count=len(faces), faces=faces, model_used=model)


@router.post("/batch-embed", response_model=BatchEmbedResponse)
async def batch_extract_embeddings(files: Annotated[list[UploadFile], File(...)]):
    results = []
    failed = 0

    for i, file in enumerate(files):
        try:
            if not file.content_type or not file.content_type.startswith("image/"):
                results.append(BatchEmbedItem(
                    index=i, faces_count=0, faces=[], error="Not an image"
                ))
                failed += 1
                continue

            image_bytes = await file.read()
            faces = face_service.analyze_image(image_bytes)
            results.append(BatchEmbedItem(index=i, faces_count=len(faces), faces=faces))
        except Exception as error:  # noqa: BLE001 - malformed images and ML backends have no shared error base.
            logger.warning("Batch image %s failed: %s", i, error)
            results.append(BatchEmbedItem(
                index=i, faces_count=0, faces=[], error=str(error)
            ))
            failed += 1

    return BatchEmbedResponse(
        total=len(files),
        processed=len(files) - failed,
        failed=failed,
        results=results,
    )
