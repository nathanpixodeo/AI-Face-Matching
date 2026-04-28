from fastapi import APIRouter, UploadFile, File, HTTPException

from app.models.schemas import DetectResponse, BoundingBox
from app.services.face_service import face_service

router = APIRouter(tags=["detection"])


@router.post("/detect", response_model=DetectResponse)
async def detect_faces(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")

    image_bytes = await file.read()
    raw_faces = face_service.detect_faces(image_bytes)

    faces = []
    for f in raw_faces:
        faces.append({
            "bbox": f["bbox"],
            "confidence": f["confidence"],
        })

    return DetectResponse(faces_count=len(faces), faces=faces)
