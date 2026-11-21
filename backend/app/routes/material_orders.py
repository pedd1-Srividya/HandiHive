from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from .. import models, schemas
from .auth import get_current_user, require_admin

router = APIRouter(
    prefix="/api/material-orders",
    tags=["material orders"]
)


def require_buyer(user):
    if user.role not in ("customer", "creator"):
        raise HTTPException(
            status_code=403,
            detail="Only customers and creators can purchase materials"
        )


# ---------------- CHECKOUT MATERIALS ----------------

@router.post(
    "/checkout",
    response_model=schemas.MaterialPurchaseOrderOut,
    status_code=201
)
def checkout_materials(
    data: schemas.MaterialCheckoutCreate,
    items: List[schemas.MaterialCartItemCreate],
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_buyer(current_user)

    if not items:
        raise HTTPException(status_code=400, detail="No materials selected")

    try:
        total = 0
        order_items = []

        for item in items:
            material = db.get(models.Material, item.material_id)

            if not material:
                raise HTTPException(
                    status_code=404,
                    detail=f"Material {item.material_id} not found"
                )

            total += material.price * item.quantity

            order_items.append(
                models.MaterialPurchaseOrderItem(
                    material_id=material.id,
                    material_name=material.name,
                    price=material.price,
                    quantity=item.quantity
                )
            )

        order = models.MaterialPurchaseOrder(
            user_id=current_user.id,
            customer_name=current_user.name,
            customer_email=current_user.email,
            phone=data.phone,
            address=data.address,
            city=data.city,
            state=data.state,
            pincode=data.pincode,
            total_amount=round(total, 2),
            payment_method=data.payment_method,
            payment_status="Pending",
            status="Placed"
        )

        db.add(order)
        db.flush()

        for item in order_items:
            item.order_id = order.id
            db.add(item)

        db.add(models.OrderStatusHistory(
            order_type="material",
            order_id=order.id,
            status="Placed",
            note="Material order placed",
            updated_by_user_id=current_user.id
        ))

        db.commit()

        return (
            db.query(models.MaterialPurchaseOrder)
            .options(joinedload(models.MaterialPurchaseOrder.items))
            .filter(models.MaterialPurchaseOrder.id == order.id)
            .first()
        )

    except Exception:
        db.rollback()
        raise


# ---------------- MY MATERIAL PURCHASES ----------------

@router.get(
    "/my-orders",
    response_model=List[schemas.MaterialPurchaseOrderOut]
)
def my_material_orders(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_buyer(current_user)

    return (
        db.query(models.MaterialPurchaseOrder)
        .options(joinedload(models.MaterialPurchaseOrder.items))
        .filter(models.MaterialPurchaseOrder.user_id == current_user.id)
        .order_by(models.MaterialPurchaseOrder.created_at.desc())
        .all()
    )


# ---------------- ADMIN: ALL MATERIAL ORDERS ----------------

@router.get(
    "/admin/all",
    response_model=List[schemas.MaterialPurchaseOrderOut]
)
def all_material_orders(
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return (
        db.query(models.MaterialPurchaseOrder)
        .options(joinedload(models.MaterialPurchaseOrder.items))
        .order_by(models.MaterialPurchaseOrder.created_at.desc())
        .all()
    )


# ---------------- ADMIN: UPDATE MATERIAL ORDER STATUS ----------------

@router.patch(
    "/admin/{order_id}/status",
    response_model=schemas.MaterialPurchaseOrderOut
)
def update_material_order_status(
    order_id: int,
    data: schemas.TrackingStatusUpdate,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    order = db.get(models.MaterialPurchaseOrder, order_id)

    if not order:
        raise HTTPException(status_code=404, detail="Material order not found")

    order.status = data.status

    db.add(models.OrderStatusHistory(
        order_type="material",
        order_id=order.id,
        status=data.status,
        note=data.note,
        updated_by_user_id=current_user.id
    ))

    db.commit()

    return (
        db.query(models.MaterialPurchaseOrder)
        .options(joinedload(models.MaterialPurchaseOrder.items))
        .filter(models.MaterialPurchaseOrder.id == order.id)
        .first()
    )
