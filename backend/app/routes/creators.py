from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/creators", tags=["creators"])


@router.get("", response_model=List[schemas.CreatorOut])
def list_creators(db: Session = Depends(get_db)):
    return db.query(models.Creator).all()


@router.get("/{creator_id}", response_model=schemas.CreatorOut)
def get_creator(creator_id: int, db: Session = Depends(get_db)):
    c = db.get(models.Creator, creator_id)
    if not c:
        raise HTTPException(404, "Creator not found")
    return c


@router.get("/{creator_id}/stats")
def creator_stats(creator_id: int, db: Session = Depends(get_db)):
    if not db.get(models.Creator, creator_id):
        raise HTTPException(404, "Creator not found")
    orders = db.query(models.CustomOrder).filter_by(creator_id=creator_id).all()
    by_status = {s: 0 for s in schemas.ORDER_STATUSES}
    for o in orders:
        by_status[o.status] = by_status.get(o.status, 0) + 1
    completed_value = sum(o.budget * o.quantity for o in orders if o.status == "Completed")
    return {"total_products": db.query(models.Product).filter_by(creator_id=creator_id).count(),
            "total_orders": len(orders), "by_status": by_status,
            "completed_order_value": completed_value}
