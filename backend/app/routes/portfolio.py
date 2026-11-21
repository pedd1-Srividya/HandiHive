
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from .auth import require_creator

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


# View all portfolio items of a creator
@router.get("/creator/{creator_id}", response_model=List[schemas.PortfolioOut])
def get_creator_portfolio(
    creator_id: int,
    db: Session = Depends(get_db)
):
    creator = db.get(models.Creator, creator_id)

    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")

    return (
        db.query(models.PortfolioItem)
        .filter(models.PortfolioItem.creator_id == creator_id)
        .order_by(models.PortfolioItem.created_at.desc())
        .all()
    )


# Add a portfolio item (creator only)
@router.post("/", response_model=schemas.PortfolioOut)
def add_portfolio_item(
    data: schemas.PortfolioCreate,
    current_user: models.User = Depends(require_creator),
    db: Session = Depends(get_db)
):
    item = models.PortfolioItem(
        title=data.title,
        description=data.description,
        image=data.image,
        creator_id=current_user.creator_id
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


# Edit a portfolio item (owner only)
@router.put("/{item_id}", response_model=schemas.PortfolioOut)
def update_portfolio_item(
    item_id: int,
    data: schemas.PortfolioCreate,
    current_user: models.User = Depends(require_creator),
    db: Session = Depends(get_db)
):
    item = db.get(models.PortfolioItem, item_id)

    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")

    if item.creator_id != current_user.creator_id:
        raise HTTPException(status_code=403, detail="Not allowed to edit this item")

    item.title = data.title
    item.description = data.description
    item.image = data.image

    db.commit()
    db.refresh(item)

    return item


# Delete a portfolio item (owner only)
@router.delete("/{item_id}")
def delete_portfolio_item(
    item_id: int,
    current_user: models.User = Depends(require_creator),
    db: Session = Depends(get_db)
):
    item = db.get(models.PortfolioItem, item_id)

    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")

    if item.creator_id != current_user.creator_id:
        raise HTTPException(status_code=403, detail="Not allowed to delete this item")

    db.delete(item)
    db.commit()

    return {"message": "Portfolio item deleted successfully"}
