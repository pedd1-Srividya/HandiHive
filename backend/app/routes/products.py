from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=List[schemas.ProductOut])
def list_products(q: Optional[str] = None, category: Optional[str] = None,
                  creator_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Product)
    if q:
        like = f"%{q}%"
        query = query.filter(models.Product.name.ilike(like) | models.Product.description.ilike(like))
    if category:
        query = query.filter(models.Product.category == category)
    if creator_id:
        query = query.filter(models.Product.creator_id == creator_id)
    return query.order_by(models.Product.id.desc()).all()


@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    p = db.get(models.Product, product_id)
    if not p:
        raise HTTPException(404, "Product not found")
    return p


@router.post("", response_model=schemas.ProductOut, status_code=201)
def add_product(data: schemas.ProductCreate, db: Session = Depends(get_db)):
    if not db.get(models.Creator, data.creator_id):
        raise HTTPException(404, "Creator not found")
    p = models.Product(**data.model_dump())
    db.add(p); db.commit(); db.refresh(p)
    return p


@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(product_id: int, data: schemas.ProductBase, db: Session = Depends(get_db)):
    p = db.get(models.Product, product_id)
    if not p:
        raise HTTPException(404, "Product not found")
    for k, v in data.model_dump().items():
        setattr(p, k, v)
    db.commit(); db.refresh(p)
    return p


@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    p = db.get(models.Product, product_id)
    if not p:
        raise HTTPException(404, "Product not found")
    db.delete(p); db.commit()
