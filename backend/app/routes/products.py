
from typing import List, Optional
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from .auth import require_creator
router = APIRouter(prefix="/api/products", tags=["products"])


# ---------------- VIEW ALL PRODUCTS ----------------

@router.get("", response_model=List[schemas.ProductOut])
def list_products(
    q: Optional[str] = None,
    category: Optional[str] = None,
    creator_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Product)

    if q:
        like = f"%{q}%"
        query = query.filter(
            models.Product.name.ilike(like)
            | models.Product.description.ilike(like)
        )

    if category:
        query = query.filter(models.Product.category == category)

    if creator_id:
        query = query.filter(models.Product.creator_id == creator_id)

    return query.order_by(models.Product.id.desc()).all()


# ---------------- VIEW SINGLE PRODUCT ----------------

@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = db.get(models.Product, product_id)

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return product


# ---------------- ADD PRODUCT (CREATOR ONLY) ----------------

@router.post("", response_model=schemas.ProductOut, status_code=201)
def add_product(
    data: schemas.ProductBase,
    current_user: models.User = Depends(require_creator),
    db: Session = Depends(get_db),
):
    creator_id = current_user.creator_id

    if not db.get(models.Creator, creator_id):
        raise HTTPException(
            status_code=404,
            detail="Creator profile not found",
        )

    product = models.Product(
        **data.model_dump(),
        creator_id=creator_id,
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


# ---------------- UPDATE PRODUCT (OWNER ONLY) ----------------

@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: int,
    data: schemas.ProductBase,
    current_user: models.User = Depends(require_creator),
    db: Session = Depends(get_db),
):
    product = db.get(models.Product, product_id)

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.creator_id != current_user.creator_id:
        raise HTTPException(
            status_code=403,
            detail="You can only edit your own products",
        )

    for key, value in data.model_dump().items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)

    return product


# ---------------- DELETE PRODUCT (OWNER ONLY) ----------------

@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    current_user: models.User = Depends(require_creator),
    db: Session = Depends(get_db),
):
    product = db.get(models.Product, product_id)

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.creator_id != current_user.creator_id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own products",
        )

    db.delete(product)
    db.commit()

    return None

@router.post("/{product_id}/try-on-image", response_model=schemas.ProductOut)
async def upload_try_on_image(
    product_id: int,
    file: UploadFile = File(...),
    current_user: models.User = Depends(require_creator),
    db: Session = Depends(get_db),
):
    # Find product
    product = db.query(models.Product).filter(
        models.Product.id == product_id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Only the product's creator can upload its try-on image
    if product.creator_id != current_user.creator_id:
        raise HTTPException(
            status_code=403,
            detail="You can only upload images for your own products",
        )

    # Check file type
    if file.content_type != "image/png":
        raise HTTPException(
            status_code=400,
            detail="Only PNG images are allowed",
        )

    # Read and validate file size
    image_data = await file.read(5 * 1024 * 1024 + 1)

    if len(image_data) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image size must be 5 MB or less",
        )

    # Validate actual PNG file signature
    if not image_data.startswith(b"\x89PNG\r\n\x1a\n"):
        raise HTTPException(
            status_code=400,
            detail="Invalid PNG image",
        )

    # Create upload directory
    upload_dir = Path(__file__).resolve().parents[2] / "uploads" / "try_on"
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Save image with a unique filename
    filename = f"{uuid4().hex}.png"
    file_path = upload_dir / filename

    with open(file_path, "wb") as image_file:
        image_file.write(image_data)

    # Remove previous locally uploaded try-on image
    old_image = product.try_on_image or ""

    if old_image.startswith("/uploads/try_on/"):
        old_filename = Path(old_image).name
        old_path = upload_dir / old_filename

        if old_path.exists():
            old_path.unlink()

    # Update product
    product.try_on_image = f"/uploads/try_on/{filename}"

    db.commit()
    db.refresh(product)

    return product
