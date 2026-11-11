from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/api/materials", tags=["materials"])


@router.get("", response_model=List[schemas.MaterialOut])
def list_materials(q: Optional[str] = None, category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Material)
    if q:
        like = f"%{q}%"
        query = query.filter(models.Material.name.ilike(like) | models.Material.description.ilike(like))
    if category:
        query = query.filter(models.Material.category == category)
    return query.all()
