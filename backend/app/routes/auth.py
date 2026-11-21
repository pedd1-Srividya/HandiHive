
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)

router = APIRouter(prefix="/api/auth", tags=["authentication"])

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    payload = decode_access_token(credentials.credentials)

    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    try:
        user_id = int(payload["sub"])
    except (ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.get(models.User, user_id)

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User account is inactive")

    return user


@router.post("/register/customer", response_model=schemas.TokenResponse)
def register_customer(data: schemas.CustomerRegister, db: Session = Depends(get_db)):

    email = data.email.strip().lower()

    if db.query(models.User).filter_by(email=email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        name=data.name.strip(),
        email=email,
        hashed_password=hash_password(data.password),
        role="customer",
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({
        "sub": str(user.id),
        "role": user.role,
    })

    return {
        "access_token": token,
        "role": user.role,
        "name": user.name,
    }


@router.post("/register/creator", response_model=schemas.TokenResponse)
def register_creator(data: schemas.CreatorRegister, db: Session = Depends(get_db)):

    email = data.email.strip().lower()

    if db.query(models.User).filter_by(email=email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    creator = models.Creator(
        name=data.name.strip(),
        bio=data.bio,
        specialty=data.specialty,
        location=data.location,
    )

    db.add(creator)
    db.flush()

    user = models.User(
        name=data.name.strip(),
        email=email,
        hashed_password=hash_password(data.password),
        role="creator",
        creator_id=creator.id,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({
        "sub": str(user.id),
        "role": user.role,
    })

    return {
        "access_token": token,
        "role": user.role,
        "name": user.name,
    }


@router.post("/login", response_model=schemas.TokenResponse)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):

    email = data.email.strip().lower()

    user = db.query(models.User).filter_by(email=email).first()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")

    token = create_access_token({
        "sub": str(user.id),
        "role": user.role,
    })

    return {
        "access_token": token,
        "role": user.role,
        "name": user.name,
    }


@router.get("/me")
def get_my_profile(current_user: models.User = Depends(get_current_user)):

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "creator_id": current_user.creator_id,
    }

def require_creator(
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "creator":
        raise HTTPException(
            status_code=403,
            detail="Only creators can perform this action",
        )

    if not current_user.creator_id:
        raise HTTPException(
            status_code=403,
            detail="Creator profile is not linked to this account",
        )

    return current_user

def require_admin(
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only the platform administrator can perform this action",
        )

    return current_user
