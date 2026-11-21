
from pathlib import Path
from uuid import uuid4
from typing import List

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
)
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from .. import models, schemas
from .auth import get_current_user

router = APIRouter(prefix="/api/reviews", tags=["reviews"])

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads" / "reviews"

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

MAX_FILE_SIZE = 5 * 1024 * 1024
MAX_PHOTOS = 3


# ---------------- SUBMIT CUSTOMER REVIEW ----------------

@router.post("", response_model=schemas.ReviewOut, status_code=201)
def create_review(
    order_id: int = Form(...),
    rating: int = Form(...),
    comment: str = Form(...),
    photos: List[UploadFile] = File(default=[]),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "customer":
        raise HTTPException(
            status_code=403,
            detail="Only customers can submit reviews",
        )

    if rating < 1 or rating > 5:
        raise HTTPException(
            status_code=400,
            detail="Rating must be between 1 and 5",
        )

    comment = comment.strip()

    if len(comment) < 3 or len(comment) > 1000:
        raise HTTPException(
            status_code=400,
            detail="Comment must contain 3 to 1000 characters",
        )

    if len(photos) > MAX_PHOTOS:
        raise HTTPException(
            status_code=400,
            detail="You can upload a maximum of 3 photos",
        )

    order = db.get(models.CustomOrder, order_id)

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.customer_email != current_user.email:
        raise HTTPException(
            status_code=403,
            detail="You can only review your own orders",
        )

    if order.status != "Completed":
        raise HTTPException(
            status_code=400,
            detail="You can review only completed orders",
        )

    existing_review = db.query(models.Review).filter(
        models.Review.order_id == order.id
    ).first()

    if existing_review:
        raise HTTPException(
            status_code=400,
            detail="You have already reviewed this order",
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    saved_paths = []

    try:
        for photo in photos:
            extension = ALLOWED_TYPES.get(photo.content_type)

            if not extension:
                raise HTTPException(
                    status_code=400,
                    detail="Only JPG, PNG and WebP images are allowed",
                )

            content = photo.file.read(MAX_FILE_SIZE + 1)

            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail="Each photo must be smaller than 5 MB",
                )

            filename = f"{uuid4().hex}{extension}"
            file_path = UPLOAD_DIR / filename

            with open(file_path, "wb") as image_file:
                image_file.write(content)

            saved_paths.append(f"/uploads/reviews/{filename}")

        review = models.Review(
            order_id=order.id,
            creator_id=order.creator_id,
            customer_name=current_user.name,
            rating=rating,
            comment=comment,
            photo_urls=saved_paths,
        )

        db.add(review)
        db.commit()
        db.refresh(review)

        return review

    except Exception:
        db.rollback()

        for image_url in saved_paths:
            filename = image_url.split("/")[-1]
            file_path = UPLOAD_DIR / filename

            if file_path.exists():
                file_path.unlink()

        raise

    finally:
        for photo in photos:
            photo.file.close()


# ---------------- VIEW CREATOR REVIEWS ----------------

@router.get(
    "/creator/{creator_id}",
    response_model=List[schemas.ReviewOut],
)
def get_creator_reviews(
    creator_id: int,
    db: Session = Depends(get_db),
):
    creator = db.get(models.Creator, creator_id)

    if not creator:
        raise HTTPException(
            status_code=404,
            detail="Creator not found",
        )

    return (
        db.query(models.Review)
        .filter(models.Review.creator_id == creator_id)
        .order_by(models.Review.created_at.desc())
        .all()
    )


# ---------------- CREATOR RATING SUMMARY ----------------

@router.get(
    "/creator/{creator_id}/summary",
    response_model=schemas.ReviewSummary,
)
def get_creator_rating_summary(
    creator_id: int,
    db: Session = Depends(get_db),
):
    creator = db.get(models.Creator, creator_id)

    if not creator:
        raise HTTPException(
            status_code=404,
            detail="Creator not found",
        )

    result = db.query(
        func.avg(models.Review.rating),
        func.count(models.Review.id),
    ).filter(
        models.Review.creator_id == creator_id
    ).first()

    return {
        "average_rating": round(float(result[0] or 0), 1),
        "total_reviews": int(result[1] or 0),
    }
