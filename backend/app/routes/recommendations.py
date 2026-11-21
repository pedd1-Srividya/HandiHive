from collections import Counter
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from .auth import get_current_user
from sqlalchemy import func

router = APIRouter(
    prefix="/api/recommendations",
    tags=["personalized recommendations"]
)


@router.get("", response_model=List[schemas.ProductOut])
def get_recommendations(
    limit: int = 8,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "customer":
        raise HTTPException(
            status_code=403,
            detail="Recommendations are available for customers only"
        )

    limit = max(1, min(limit, 20))

    # Get products saved in the customer's wishlist.
    wishlist_products = (
        db.query(models.Product)
        .join(
            models.Wishlist,
            models.Wishlist.product_id == models.Product.id
        )
        .filter(models.Wishlist.user_id == current_user.id)
        .all()
    )

    # Get products previously purchased by the customer.
    purchased_products = (
        db.query(models.Product)
        .join(
            models.PurchaseOrderItem,
            models.PurchaseOrderItem.product_id == models.Product.id
        )
        .join(
            models.PurchaseOrder,
            models.PurchaseOrder.id == models.PurchaseOrderItem.order_id
        )
        .filter(models.PurchaseOrder.user_id == current_user.id)
        .all()
    )

    # Exclude products already saved or purchased.
    excluded_ids = {
        p.id for p in wishlist_products + purchased_products
    }

    # No previous activity: recommend popular products first.
    if not wishlist_products and not purchased_products:

        popular_ids = (
            db.query(
                models.PurchaseOrderItem.product_id,
                func.sum(models.PurchaseOrderItem.quantity).label("sold")
            )
            .join(
                models.PurchaseOrder,
                models.PurchaseOrder.id == models.PurchaseOrderItem.order_id
            )
            .group_by(models.PurchaseOrderItem.product_id)
            .order_by(func.sum(models.PurchaseOrderItem.quantity).desc())
            .limit(limit)
            .all()
        )

        popular_product_ids = [row[0] for row in popular_ids]

        popular_products = (
            db.query(models.Product)
            .filter(models.Product.id.in_(popular_product_ids))
            .all()
        )

        popular_map = {p.id: p for p in popular_products}

        recommendations = [
            popular_map[product_id]
            for product_id in popular_product_ids
            if product_id in popular_map
        ]

        if len(recommendations) < limit:
            recent_products = (
                db.query(models.Product)
                .order_by(models.Product.created_at.desc())
                .all()
            )

            for product in recent_products:
                if product.id not in {
                    p.id for p in recommendations
                }:
                    recommendations.append(product)

                if len(recommendations) >= limit:
                    break

        return recommendations[:limit]

    # Build customer preferences.
    categories = Counter()
    materials = Counter()
    colours = Counter()

    # Wishlist receives higher priority.
    for product in wishlist_products:
        categories[product.category.lower()] += 3

        if product.material:
            materials[product.material.lower()] += 2

        if product.colour:
            colours[product.colour.lower()] += 2

    # Previous purchases also influence recommendations.
    for product in purchased_products:
        categories[product.category.lower()] += 2

        if product.material:
            materials[product.material.lower()] += 1

        if product.colour:
            colours[product.colour.lower()] += 1

    # Get all available products.
    all_products = (
        db.query(models.Product)
        .filter(~models.Product.id.in_(excluded_ids))
        .all()
    )

    # Calculate similarity scores.
    scored_products = []

    for product in all_products:
        score = 0

        category = (product.category or "").lower()
        material = (product.material or "").lower()
        colour = (product.colour or "").lower()

        score += categories[category] * 5
        score += materials[material] * 3
        score += colours[colour] * 2

        if score > 0:
            scored_products.append((score, product))

    # Highest similarity first.
    scored_products.sort(
        key=lambda item: (
            item[0],
            item[1].created_at
        ),
        reverse=True
    )

    recommendations = [
        product for score, product in scored_products[:limit]
    ]

    # Fill remaining positions with recent products.
    if len(recommendations) < limit:
        already_added = {
            p.id for p in recommendations
        }

        recent_products = (
            db.query(models.Product)
            .filter(~models.Product.id.in_(excluded_ids))
            .order_by(models.Product.created_at.desc())
            .all()
        )

        for product in recent_products:
            if product.id not in already_added:
                recommendations.append(product)
                already_added.add(product.id)

            if len(recommendations) >= limit:
                break

    return recommendations[:limit]