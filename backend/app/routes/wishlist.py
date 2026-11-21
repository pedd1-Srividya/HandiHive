
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from .auth import get_current_user

router = APIRouter(prefix="/api/wishlist", tags=["wishlist"])


# ---------------- ADD PRODUCT TO WISHLIST ----------------

@router.post("/{product_id}", status_code=201)
def add_to_wishlist(
    product_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "customer":
        raise HTTPException(
            status_code=403,
            detail="Only customers can use the wishlist",
        )

    product = db.get(models.Product, product_id)

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = db.query(models.Wishlist).filter(
        models.Wishlist.user_id == current_user.id,
        models.Wishlist.product_id == product_id,
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Product is already in your wishlist",
        )

    item = models.Wishlist(
        user_id=current_user.id,
        product_id=product_id,
    )

    db.add(item)
    db.commit()

    return {"message": "Product added to wishlist"}


# ---------------- VIEW MY WISHLIST ----------------

@router.get("")
def get_my_wishlist(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "customer":
        raise HTTPException(
            status_code=403,
            detail="Only customers can view a wishlist",
        )

    items = (
        db.query(models.Wishlist)
        .filter(models.Wishlist.user_id == current_user.id)
        .order_by(models.Wishlist.created_at.desc())
        .all()
    )

    return [item.product for item in items if item.product]


# ---------------- REMOVE PRODUCT FROM WISHLIST ----------------

@router.delete("/{product_id}")
def remove_from_wishlist(
    product_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "customer":
        raise HTTPException(
            status_code=403,
            detail="Only customers can manage a wishlist",
        )

    item = db.query(models.Wishlist).filter(
        models.Wishlist.user_id == current_user.id,
        models.Wishlist.product_id == product_id,
    ).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Product not found in your wishlist",
        )

    db.delete(item)
    db.commit()

    return {"message": "Product removed from wishlist"}
