
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from .auth import get_current_user, require_creator

router = APIRouter(prefix="/api/orders", tags=["orders"])


# ---------------- CREATE CUSTOM ORDER (CUSTOMER ONLY) ----------------

@router.post("", response_model=schemas.OrderOut, status_code=201)
def create_order(
    data: schemas.OrderCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "customer":
        raise HTTPException(
            status_code=403,
            detail="Only customers can create custom orders",
        )

    if not db.get(models.Creator, data.creator_id):
        raise HTTPException(
            status_code=404,
            detail="Creator not found",
        )

    order_data = data.model_dump()
    order_data["customer_name"] = current_user.name
    order_data["customer_email"] = current_user.email

    order = models.CustomOrder(**order_data)

    db.add(order)
    db.flush()

    # Record initial tracking status.
    db.add(models.OrderStatusHistory(
        order_type="custom",
        order_id=order.id,
        status=order.status,
        note="Custom order placed",
        updated_by_user_id=current_user.id
    ))

    db.commit()
    db.refresh(order)

    return order


# ---------------- VIEW MY ORDERS ----------------

@router.get("", response_model=List[schemas.OrderOut])
def list_orders(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.CustomOrder)

    if current_user.role == "customer":
        query = query.filter(
            models.CustomOrder.customer_email == current_user.email
        )

    elif current_user.role == "creator":
        query = query.filter(
            models.CustomOrder.creator_id == current_user.creator_id
        )

    else:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to view orders",
        )

    return query.order_by(models.CustomOrder.id.desc()).all()


# ---------------- UPDATE ORDER STATUS (CREATOR ONLY) ----------------

@router.patch("/{order_id}/status", response_model=schemas.OrderOut)
def update_status(
    order_id: int,
    data: schemas.StatusUpdate,
    current_user: models.User = Depends(require_creator),
    db: Session = Depends(get_db),
):
    order = db.get(models.CustomOrder, order_id)

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    if order.creator_id != current_user.creator_id:
        raise HTTPException(
            status_code=403,
            detail="You can only update orders assigned to you",
        )

    note = data.note.strip()

    # Avoid duplicate history when nothing has changed.
    if order.status == data.status and not note:
        return order

    order.status = data.status

    # Save the creator's progress note in tracking history.
    db.add(models.OrderStatusHistory(
        order_type="custom",
        order_id=order.id,
        status=data.status,
        note=note or f"Order status updated to {data.status}",
        updated_by_user_id=current_user.id
    ))

    db.commit()
    db.refresh(order)

    return order