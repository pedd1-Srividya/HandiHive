
from fastapi import APIRouter
from .. import schemas
from ..services.ai_service import generate_description, generate_caption

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/describe", response_model=schemas.DescribeResponse)
def describe(data: schemas.DescribeRequest):
    return generate_description(data)


@router.post("/caption", response_model=schemas.CaptionResponse)
def caption(data: schemas.CaptionRequest):
    return generate_caption(data)
