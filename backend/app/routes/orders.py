from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("", response_model=schemas.OrderOut, status_code=201)
def create_order(data: schemas.OrderCreate, db: Session = Depends(get_db)):
    if not db.get(models.Creator, data.creator_id):
        raise HTTPException(404, "Creator not found")
    data.customer_email = data.customer_email.strip().lower()
    o = models.CustomOrder(**data.model_dump())
    db.add(o); db.commit(); db.refresh(o)
    return o


@router.get("", response_model=List[schemas.OrderOut])
def list_orders(email: Optional[str] = None, creator_id: Optional[int] = None, db: Session = Depends(get_db)):
    if not email and not creator_id:
        raise HTTPException(400, "Provide an email or a creator_id")
    q = db.query(models.CustomOrder)
    if email:
        q = q.filter(models.CustomOrder.customer_email == email.strip().lower())
    if creator_id:
        q = q.filter(models.CustomOrder.creator_id == creator_id)
    return q.order_by(models.CustomOrder.id.desc()).all()


@router.patch("/{order_id}/status", response_model=schemas.OrderOut)
def update_status(order_id: int, data: schemas.StatusUpdate, db: Session = Depends(get_db)):
    o = db.get(models.CustomOrder, order_id)
    if not o:
        raise HTTPException(404, "Order not found")
    o.status = data.status
    db.commit(); db.refresh(o)
    return o
