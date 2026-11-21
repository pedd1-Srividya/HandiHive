
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from .. import models, schemas
from .auth import get_current_user

router = APIRouter(prefix="/api/cart", tags=["shopping cart"])


def require_customer(current_user):
    if current_user.role != "customer":
        raise HTTPException(
            status_code=403,
            detail="Only customers can use the shopping cart"
        )


# ---------------- VIEW CART ----------------

@router.get("", response_model=List[schemas.CartItemOut])
def view_cart(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_customer(current_user)

    return (
        db.query(models.CartItem)
        .options(
            joinedload(models.CartItem.product)
            .joinedload(models.Product.creator)
        )
        .filter(models.CartItem.user_id == current_user.id)
        .order_by(models.CartItem.id.desc())
        .all()
    )


# ---------------- ADD TO CART ----------------

@router.post("", response_model=schemas.CartItemOut, status_code=201)
def add_to_cart(
    data: schemas.CartItemCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_customer(current_user)

    product = db.get(models.Product, data.product_id)

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    existing = db.query(models.CartItem).filter(
        models.CartItem.user_id == current_user.id,
        models.CartItem.product_id == data.product_id
    ).first()

    if existing:
        if existing.quantity + data.quantity > 100:
            raise HTTPException(
                status_code=400,
                detail="Maximum quantity allowed is 100"
            )

        existing.quantity += data.quantity
        cart_item = existing
    else:
        cart_item = models.CartItem(
            user_id=current_user.id,
            product_id=data.product_id,
            quantity=data.quantity
        )
        db.add(cart_item)

    db.commit()

    return (
        db.query(models.CartItem)
        .options(
            joinedload(models.CartItem.product)
            .joinedload(models.Product.creator)
        )
        .filter(models.CartItem.id == cart_item.id)
        .first()
    )


# ---------------- UPDATE QUANTITY ----------------

@router.patch("/{item_id}", response_model=schemas.CartItemOut)
def update_cart_item(
    item_id: int,
    data: schemas.CartQuantityUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_customer(current_user)

    item = db.query(models.CartItem).filter(
        models.CartItem.id == item_id,
        models.CartItem.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Cart item not found"
        )

    item.quantity = data.quantity
    db.commit()

    return (
        db.query(models.CartItem)
        .options(
            joinedload(models.CartItem.product)
            .joinedload(models.Product.creator)
        )
        .filter(models.CartItem.id == item.id)
        .first()
    )


# ---------------- REMOVE CART ITEM ----------------

@router.delete("/{item_id}")
def remove_cart_item(
    item_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_customer(current_user)

    item = db.query(models.CartItem).filter(
        models.CartItem.id == item_id,
        models.CartItem.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Cart item not found"
        )

    db.delete(item)
    db.commit()

    return {"message": "Item removed from cart"}


# ---------------- CLEAR CART ----------------

@router.delete("")
def clear_cart(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_customer(current_user)

    db.query(models.CartItem).filter(
        models.CartItem.user_id == current_user.id
    ).delete(synchronize_session=False)

    db.commit()

    return {"message": "Cart cleared successfully"}


# ---------------- CHECKOUT ----------------

@router.post("/checkout", response_model=schemas.PurchaseOrderOut, status_code=201)
def checkout(
    data: schemas.CheckoutCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_customer(current_user)

    cart_items = (
        db.query(models.CartItem)
        .options(joinedload(models.CartItem.product))
        .filter(models.CartItem.user_id == current_user.id)
        .all()
    )

    if not cart_items:
        raise HTTPException(
            status_code=400,
            detail="Your cart is empty"
        )

    try:
        total_amount = sum(
            item.product.price * item.quantity
            for item in cart_items
        )

        order = models.PurchaseOrder(
            user_id=current_user.id,
            customer_name=current_user.name,
            customer_email=current_user.email,
            phone=data.phone,
            address=data.address,
            city=data.city,
            state=data.state,
            pincode=data.pincode,
            total_amount=round(total_amount, 2),
            payment_method=data.payment_method,
            payment_status="Pending",
            status="Placed"
        )

        db.add(order)
        db.flush()

        for item in cart_items:
            order_item = models.PurchaseOrderItem(
                order_id=order.id,
                product_id=item.product_id,
                product_name=item.product.name,
                price=item.product.price,
                quantity=item.quantity
            )

            db.add(order_item)
            db.flush()

            # Record initial tracking status for this product.
            db.add(models.OrderStatusHistory(
                order_type="product",
                order_id=order.id,
                item_id=order_item.id,
                status="Placed",
                note="Product purchase placed",
                updated_by_user_id=current_user.id
            ))

        for item in cart_items:
            db.delete(item)

        db.commit()
        db.refresh(order)

        return order

    except Exception:
        db.rollback()
        raise


# ---------------- MY PURCHASE HISTORY ----------------

@router.get(
    "/purchases",
    response_model=List[schemas.PurchaseOrderOut]
)
def my_purchases(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_customer(current_user)

    return (
        db.query(models.PurchaseOrder)
        .filter(models.PurchaseOrder.user_id == current_user.id)
        .order_by(models.PurchaseOrder.created_at.desc())
        .all()
    )

# ---------------- CREATOR PURCHASE ORDERS ----------------

@router.get(
    "/creator-purchases",
    response_model=List[schemas.PurchaseOrderOut]
)
def creator_purchases(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "creator" or not current_user.creator_id:
        raise HTTPException(
            status_code=403,
            detail="Only creators can view their purchases"
        )

    orders = (
        db.query(models.PurchaseOrder)
        .join(models.PurchaseOrder.items)
        .join(models.PurchaseOrderItem.product)
        .filter(
            models.Product.creator_id == current_user.creator_id
        )
        .options(
            joinedload(models.PurchaseOrder.items)
        )
        .distinct()
        .order_by(models.PurchaseOrder.created_at.desc())
        .all()
    )

    result = []

    for order in orders:
        my_items = [
            item for item in order.items
            if item.product
            and item.product.creator_id == current_user.creator_id
        ]

        order_data = {
            "id": order.id,
            "customer_name": order.customer_name,
            "customer_email": order.customer_email,
            "phone": order.phone,
            "address": order.address,
            "city": order.city,
            "state": order.state,
            "pincode": order.pincode,
            "total_amount": order.total_amount,
            "payment_method": order.payment_method,
            "payment_status": order.payment_status,
            "status": order.status,
            "created_at": order.created_at,
            "items": my_items,
        }

        result.append(order_data)

    return result


# ---------------- CREATOR: UPDATE PRODUCT PURCHASE STATUS ----------------

@router.patch(
    "/creator-purchases/{order_id}/items/{item_id}/status"
)
def update_creator_purchase_status(
    order_id: int,
    item_id: int,
    data: schemas.TrackingStatusUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "creator" or not current_user.creator_id:
        raise HTTPException(
            status_code=403,
            detail="Only creators can update product purchase status"
        )

    # Find the purchased item in the specified order.
    order_item = (
        db.query(models.PurchaseOrderItem)
        .join(models.PurchaseOrderItem.product)
        .filter(
            models.PurchaseOrderItem.id == item_id,
            models.PurchaseOrderItem.order_id == order_id,
            models.Product.creator_id == current_user.creator_id
        )
        .first()
    )

    if not order_item:
        raise HTTPException(
            status_code=404,
            detail="Purchased product not found or not assigned to you"
        )

    # Record the new status for this specific product.
    db.add(models.OrderStatusHistory(
        order_type="product",
        order_id=order_id,
        item_id=item_id,
        status=data.status,
        note=data.note or "Product purchase status updated",
        updated_by_user_id=current_user.id
    ))

    db.commit()

    return {
        "message": "Product purchase status updated successfully",
        "order_id": order_id,
        "item_id": item_id,
        "status": data.status
    }
