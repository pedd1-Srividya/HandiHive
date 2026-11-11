"""Pydantic schemas: validate incoming data and shape outgoing data."""
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

ORDER_STATUSES = ["Pending", "Accepted", "Rejected", "In Progress", "Completed"]


class CreatorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    bio: str
    specialty: str
    location: str


class ProductBase(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    category: str = Field(min_length=2, max_length=50)
    price: float = Field(gt=0)
    description: str = ""
    material: str = ""
    colour: str = ""
    image: str = ""


class ProductCreate(ProductBase):
    creator_id: int


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    creator_id: int
    creator_name: str


class MaterialOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    category: str
    price: float
    description: str
    image: str


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=100)
    customer_email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    creator_id: int
    category: str = Field(min_length=2)
    material: str = ""
    colour: str = ""
    size: str = ""
    quantity: int = Field(ge=1, le=1000)
    budget: float = Field(ge=0)
    requirements: str = Field(min_length=5)
    design_description: str = ""


class OrderOut(OrderCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str
    creator_name: str
    created_at: datetime


class StatusUpdate(BaseModel):
    status: Literal["Pending", "Accepted", "Rejected", "In Progress", "Completed"]


class DescribeRequest(BaseModel):
    name: str = Field(min_length=2)
    category: str = Field(min_length=2)
    material: str = ""
    colour: str = ""
    details: str = ""


class DescribeResponse(BaseModel):
    description: str
    mode: Literal["ai", "demo"]
    note: str


# AI Social Media Caption Generator

class CaptionRequest(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    category: str = Field(min_length=2, max_length=100)
    material: str = ""
    colour: str = ""
    details: str = ""
    platform: Literal["Instagram", "Facebook"] = "Instagram"
    tone: Literal["Cute", "Professional", "Creative", "Friendly"] = "Creative"


class CaptionResponse(BaseModel):
    caption: str
    hashtags: list[str]
    promotional_text: str
    mode: Literal["ai", "demo"]
    note: str

