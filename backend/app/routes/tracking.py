
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from .auth import get_current_user

router = APIRouter(prefix="/api/tracking", tags=["order tracking"])


@router.get("/{order_type}/{order_id}", response_model=list[schemas.TrackingHistoryOut])
def get_tracking_history(
    order_type: str,
    order_id: int,
    item_id: Optional[int] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if order_type not in ("custom", "product", "material"):
        raise HTTPException(
            status_code=400,
            detail="Invalid order type"
        )

    # Admin can view all order tracking.
    if current_user.role == "admin":
        pass

    elif order_type == "custom":
        order = db.get(models.CustomOrder, order_id)

        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        allowed = (
            current_user.role == "customer"
            and order.customer_email == current_user.email
        ) or (
            current_user.role == "creator"
            and order.creator_id == current_user.creator_id
        )

        if not allowed:
            raise HTTPException(status_code=403, detail="Access denied")

    elif order_type == "material":
        order = db.get(models.MaterialPurchaseOrder, order_id)

        if not order:
            raise HTTPException(status_code=404, detail="Material order not found")

        if order.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

    elif order_type == "product":
        order = db.get(models.PurchaseOrder, order_id)

        if not order:
            raise HTTPException(status_code=404, detail="Purchase order not found")

        if current_user.role == "customer":
            if order.user_id != current_user.id:
                raise HTTPException(status_code=403, detail="Access denied")

        elif current_user.role == "creator":
            if not current_user.creator_id:
                raise HTTPException(status_code=403, detail="Access denied")

            items = (
                db.query(models.PurchaseOrderItem)
                .join(models.PurchaseOrderItem.product)
                .filter(
                    models.PurchaseOrderItem.order_id == order_id,
                    models.Product.creator_id == current_user.creator_id
                )
                .all()
            )

            allowed_ids = [item.id for item in items]

            if not allowed_ids:
                raise HTTPException(status_code=403, detail="Access denied")

            if item_id is not None and item_id not in allowed_ids:
                raise HTTPException(status_code=403, detail="Access denied")

        else:
            raise HTTPException(status_code=403, detail="Access denied")

    else:
        raise HTTPException(status_code=403, detail="Access denied")

    query = db.query(models.OrderStatusHistory).filter(
        models.OrderStatusHistory.order_type == order_type,
        models.OrderStatusHistory.order_id == order_id
    )

    if order_type == "product":
        if item_id is not None:
            query = query.filter(
                models.OrderStatusHistory.item_id == item_id
            )
        elif current_user.role == "creator":
            query = query.filter(
                models.OrderStatusHistory.item_id.in_(allowed_ids)
            )

    return query.order_by(
        models.OrderStatusHistory.created_at.asc()
    ).all()
