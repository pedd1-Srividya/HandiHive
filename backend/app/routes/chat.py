import os
import uuid
from pathlib import Path

from fastapi import File, Form, UploadFile
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from .. import models
from .auth import get_current_user


router = APIRouter(prefix="/api/chat", tags=["chat"])


# ---------------- REQUEST SCHEMA ----------------

class ChatMessageCreate(BaseModel):
    creator_id: int
    customer_id: Optional[int] = None
    order_id: Optional[int] = None
    message: str = Field(min_length=1, max_length=2000)


# ---------------- HELPER FUNCTIONS ----------------

def get_conversation_access(
    current_user: models.User,
    customer_id: int,
    creator_id: int,
):
    """Check whether the logged-in user belongs to this conversation."""

    if current_user.role == "customer":
        if current_user.id != customer_id:
            raise HTTPException(
                status_code=403,
                detail="You cannot access another customer's conversation",
            )

    elif current_user.role == "creator":
        if current_user.creator_id != creator_id:
            raise HTTPException(
                status_code=403,
                detail="You cannot access another creator's conversation",
            )

    else:
        raise HTTPException(
            status_code=403,
            detail="Invalid user role",
        )


def verify_order_access(
    db: Session,
    order_id: int,
    customer_id: int,
    creator_id: int,
):
    """Verify that an order belongs to this customer and creator."""

    order = db.get(models.CustomOrder, order_id)

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    customer = db.get(models.User, customer_id)

    if (
        order.creator_id != creator_id
        or not customer
        or order.customer_email.lower() != customer.email.lower()
    ):
        raise HTTPException(
            status_code=403,
            detail="This order does not belong to this conversation",
        )

    return order


# ---------------- SEND MESSAGE ----------------

@router.post("/messages", status_code=201)
def send_message(
    data: ChatMessageCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    message_text = data.message.strip()

    if not message_text:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty",
        )

    creator = db.get(models.Creator, data.creator_id)

    if not creator:
        raise HTTPException(
            status_code=404,
            detail="Creator not found",
        )

    # Customer sends a message
    if current_user.role == "customer":

        customer_id = current_user.id
        creator_id = data.creator_id
        sender_role = "customer"

    # Creator replies to a customer
    elif current_user.role == "creator":

        if not current_user.creator_id:
            raise HTTPException(
                status_code=403,
                detail="Creator profile is not linked to this account",
            )

        if current_user.creator_id != data.creator_id:
            raise HTTPException(
                status_code=403,
                detail="You cannot send messages as another creator",
            )

        if not data.customer_id:
            raise HTTPException(
                status_code=400,
                detail="Customer ID is required when a creator sends a message",
            )

        customer = db.get(models.User, data.customer_id)

        if not customer or customer.role != "customer":
            raise HTTPException(
                status_code=404,
                detail="Customer not found",
            )

        customer_id = customer.id
        creator_id = current_user.creator_id
        sender_role = "creator"

    else:
        raise HTTPException(
            status_code=403,
            detail="Only customers and creators can send messages",
        )

    # Check optional order association
    if data.order_id is not None:
        verify_order_access(
            db,
            data.order_id,
            customer_id,
            creator_id,
        )

    # A creator can only reply to an existing conversation
    # or a customer who has an order with that creator.
    if sender_role == "creator":

        existing_message = (
            db.query(models.ChatMessage)
            .filter(
                models.ChatMessage.customer_id == customer_id,
                models.ChatMessage.creator_id == creator_id,
            )
            .first()
        )

        matching_order = (
            db.query(models.CustomOrder)
            .filter(
                models.CustomOrder.creator_id == creator_id,
                models.CustomOrder.customer_email == customer.email,
            )
            .first()
        )

        if not existing_message and not matching_order:
            raise HTTPException(
                status_code=403,
                detail="You can only message customers who have contacted you or placed an order",
            )

    chat_message = models.ChatMessage(
        customer_id=customer_id,
        creator_id=creator_id,
        order_id=data.order_id,
        sender_role=sender_role,
        message=message_text,
    )

    db.add(chat_message)
    db.commit()
    db.refresh(chat_message)

    return {
        "id": chat_message.id,
        "customer_id": chat_message.customer_id,
        "creator_id": chat_message.creator_id,
        "order_id": chat_message.order_id,
        "sender_role": chat_message.sender_role,
        "message": chat_message.message,
        "image_url": chat_message.image_url,
        "created_at": chat_message.created_at,
    }


# ---------------- SEND CHAT IMAGE ----------------

@router.post("/messages/image", status_code=201)
async def send_chat_image(
    creator_id: int = Form(...),
    customer_id: Optional[int] = Form(None),
    order_id: Optional[int] = Form(None),
    caption: str = Form(""),
    image: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allowed_types = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }

    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG and WEBP images are allowed",
        )

    image_data = await image.read(5 * 1024 * 1024 + 1)

    if len(image_data) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image size must be 5 MB or less",
        )

    creator = db.get(models.Creator, creator_id)

    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")

    if current_user.role == "customer":
        actual_customer_id = current_user.id
        sender_role = "customer"

    elif current_user.role == "creator":
        if current_user.creator_id != creator_id:
            raise HTTPException(status_code=403, detail="Invalid creator")

        if not customer_id:
            raise HTTPException(
                status_code=400,
                detail="Customer ID is required",
            )

        customer = db.get(models.User, customer_id)

        if not customer or customer.role != "customer":
            raise HTTPException(status_code=404, detail="Customer not found")

        actual_customer_id = customer.id
        sender_role = "creator"

        existing_message = (
            db.query(models.ChatMessage)
            .filter(
                models.ChatMessage.customer_id == actual_customer_id,
                models.ChatMessage.creator_id == creator_id,
            )
            .first()
        )

        matching_order = (
            db.query(models.CustomOrder)
            .filter(
                models.CustomOrder.creator_id == creator_id,
                models.CustomOrder.customer_email == customer.email,
            )
            .first()
        )

        if not existing_message and not matching_order:
            raise HTTPException(
                status_code=403,
                detail="You can only message customers who contacted you or placed an order",
            )

    else:
        raise HTTPException(status_code=403, detail="Invalid user role")

    if order_id is not None:
        verify_order_access(
            db, order_id, actual_customer_id, creator_id
        )

    upload_dir = Path(__file__).resolve().parents[2] / "uploads" / "chat"
    upload_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{allowed_types[image.content_type]}"
    file_path = upload_dir / filename

    with open(file_path, "wb") as file:
        file.write(image_data)

    image_url = f"/uploads/chat/{filename}"

    chat_message = models.ChatMessage(
        customer_id=actual_customer_id,
        creator_id=creator_id,
        order_id=order_id,
        sender_role=sender_role,
        message=caption.strip() or "Image",
        image_url=image_url,
    )

    db.add(chat_message)
    db.commit()
    db.refresh(chat_message)

    return {
        "id": chat_message.id,
        "customer_id": chat_message.customer_id,
        "creator_id": chat_message.creator_id,
        "order_id": chat_message.order_id,
        "sender_role": chat_message.sender_role,
        "message": chat_message.message,
        "image_url": chat_message.image_url,
        "created_at": chat_message.created_at,
    }



# ---------------- GET CHAT HISTORY ----------------

@router.get("/messages")
def get_messages(
    creator_id: int = Query(...),
    customer_id: Optional[int] = Query(None),
    order_id: Optional[int] = Query(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "customer":
        actual_customer_id = current_user.id

        if customer_id is not None and customer_id != actual_customer_id:
            raise HTTPException(
                status_code=403,
                detail="You cannot access another customer's messages",
            )

    elif current_user.role == "creator":
        if current_user.creator_id != creator_id:
            raise HTTPException(
                status_code=403,
                detail="You cannot access another creator's messages",
            )

        if customer_id is None:
            raise HTTPException(
                status_code=400,
                detail="Customer ID is required",
            )

        actual_customer_id = customer_id

    else:
        raise HTTPException(
            status_code=403,
            detail="Invalid user role",
        )

    get_conversation_access(
        current_user,
        actual_customer_id,
        creator_id,
    )

    if not db.get(models.Creator, creator_id):
        raise HTTPException(
            status_code=404,
            detail="Creator not found",
        )

    if not db.get(models.User, actual_customer_id):
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    query = db.query(models.ChatMessage).filter(
        models.ChatMessage.customer_id == actual_customer_id,
        models.ChatMessage.creator_id == creator_id,
    )

    if order_id is not None:
        query = query.filter(
            models.ChatMessage.order_id == order_id
        )

    messages = query.order_by(
        models.ChatMessage.created_at.asc(),
        models.ChatMessage.id.asc(),
    ).all()

    return [
        {
            "id": msg.id,
            "customer_id": msg.customer_id,
            "creator_id": msg.creator_id,
            "order_id": msg.order_id,
            "sender_role": msg.sender_role,
            "message": msg.message,
            "image_url": msg.image_url,
            "created_at": msg.created_at,
        }
        for msg in messages
    ]


# ---------------- GET CONVERSATIONS ----------------

@router.get("/conversations")
def get_conversations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "customer":

        messages = (
            db.query(models.ChatMessage)
            .filter(
                models.ChatMessage.customer_id == current_user.id
            )
            .order_by(
                models.ChatMessage.created_at.desc(),
                models.ChatMessage.id.desc(),
            )
            .all()
        )

    elif current_user.role == "creator":

        if not current_user.creator_id:
            raise HTTPException(
                status_code=403,
                detail="Creator profile is not linked to this account",
            )

        messages = (
            db.query(models.ChatMessage)
            .filter(
                models.ChatMessage.creator_id == current_user.creator_id
            )
            .order_by(
                models.ChatMessage.created_at.desc(),
                models.ChatMessage.id.desc(),
            )
            .all()
        )

    else:
        raise HTTPException(
            status_code=403,
            detail="Invalid user role",
        )

    conversations = {}
    
    for msg in messages:
        key = (msg.customer_id, msg.creator_id)

        if key in conversations:
            continue

        customer = db.get(models.User, msg.customer_id)
        creator = db.get(models.Creator, msg.creator_id)

        conversations[key] = {
            "customer_id": msg.customer_id,
            "customer_name": customer.name if customer else "Customer",
            "creator_id": msg.creator_id,
            "creator_name": creator.name if creator else "Creator",
            "last_message": msg.message,
            "last_sender_role": msg.sender_role,
            "last_message_at": msg.created_at,
            "order_id": msg.order_id,
        }

    return list(conversations.values())
