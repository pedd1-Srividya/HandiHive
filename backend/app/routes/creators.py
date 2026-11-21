
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from .auth import require_creator

router = APIRouter(prefix="/api/creators", tags=["creators"])


@router.get("", response_model=List[schemas.CreatorOut])
def list_creators(db: Session = Depends(get_db)):
    return (
        db.query(models.Creator)
        .join(
            models.User,
            models.User.creator_id == models.Creator.id
        )
        .filter(models.User.role == "creator")
        .distinct()
        .order_by(models.Creator.name)
        .all()
    )


@router.get("/{creator_id}", response_model=schemas.CreatorOut)
def get_creator(creator_id: int, db: Session = Depends(get_db)):
    creator = db.get(models.Creator, creator_id)

    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")

    return creator


@router.put("/me", response_model=schemas.CreatorOut)
def update_my_profile(
    data: schemas.CreatorUpdate,
    current_user: models.User = Depends(require_creator),
    db: Session = Depends(get_db),
):
    creator = db.get(models.Creator, current_user.creator_id)

    if not creator:
        raise HTTPException(status_code=404, detail="Creator profile not found")

    creator.name = data.name
    creator.bio = data.bio
    creator.specialty = data.specialty
    creator.location = data.location
    creator.profile_image = data.profile_image
    creator.cover_image = data.cover_image

    db.commit()
    db.refresh(creator)

    return creator


@router.get("/{creator_id}/stats")
def creator_stats(creator_id: int, db: Session = Depends(get_db)):
    if not db.get(models.Creator, creator_id):
        raise HTTPException(status_code=404, detail="Creator not found")

    orders = db.query(models.CustomOrder).filter_by(
        creator_id=creator_id
    ).all()

    by_status = {s: 0 for s in schemas.ORDER_STATUSES}

    for order in orders:
        by_status[order.status] = by_status.get(order.status, 0) + 1

    completed_value = sum(
        order.budget * order.quantity
        for order in orders
        if order.status == "Completed"
    )

    return {
        "total_products": db.query(models.Product).filter_by(
            creator_id=creator_id
        ).count(),
        "total_orders": len(orders),
        "by_status": by_status,
        "completed_order_value": completed_value,
    }
