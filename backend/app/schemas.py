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
    profile_image: str=""
    cover_image: str = ""


class ProductBase(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    category: str = Field(min_length=2, max_length=50)
    price: float = Field(gt=0)
    description: str = ""
    material: str = ""
    colour: str = ""
    image: str = ""
    try_on_image: str = ""


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
    creator_id: int
    category: str = Field(min_length=2)
    material: str = ""
    colour: str = ""
    size: str = ""
    quantity: int = Field(ge=1, le=1000)
    budget: float = Field(ge=0)
    requirements: str = Field(min_length=5)
    design_description: str = ""
    preview_image: Optional[str] = None




class OrderOut(OrderCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_name: str
    customer_email: str
    status: str
    creator_name: str
    created_at: datetime



class StatusUpdate(BaseModel):
    status: Literal["Pending", "Accepted", "Rejected", "In Progress", "Completed"]
    note: str = Field(default="", max_length=500)

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


# ---------------- AUTHENTICATION SCHEMAS ----------------

class CustomerRegister(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(min_length=8, max_length=128)


class CreatorRegister(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(min_length=8, max_length=128)
    bio: str = ""
    specialty: str = ""
    location: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    creator_id: Optional[int] = None

class CreatorUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    bio: str = Field(max_length=1000)
    specialty: str = Field(min_length=2, max_length=100)
    location: str = Field(max_length=150)
    profile_image: str = Field(default="", max_length=500)
    cover_image: str = Field(default="", max_length=500)

# ---------------- PORTFOLIO SCHEMAS ----------------

class PortfolioCreate(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    description: str = Field(default="", max_length=1000)
    image: str = Field(min_length=5, max_length=500)


class PortfolioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    image: str
    creator_id: int
    created_at: datetime


# ---------------- CUSTOMER REVIEWS ----------------

class ReviewCreate(BaseModel):
    order_id: int
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=3, max_length=1000)


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int
    creator_id: int
    customer_name: str
    rating: int
    comment: str
    photo_urls: list[str] = Field(default_factory=list)
    created_at: datetime


class ReviewSummary(BaseModel):
    average_rating: float
    total_reviews: int


# ---------------- SHOPPING CART SCHEMAS ----------------

class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1, le=100)


class CartQuantityUpdate(BaseModel):
    quantity: int = Field(ge=1, le=100)


class CartItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity: int
    product: ProductOut


# ---------------- CHECKOUT SCHEMAS ----------------

class CheckoutCreate(BaseModel):
    phone: str = Field(min_length=10, max_length=20)
    address: str = Field(min_length=5, max_length=500)
    city: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)
    pincode: str = Field(min_length=6, max_length=10)
    payment_method: Literal["Cash on Delivery"] = "Cash on Delivery"


class PurchaseOrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    product_name: str
    price: float
    quantity: int


class PurchaseOrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_name: str
    customer_email: str
    phone: str
    address: str
    city: str
    state: str
    pincode: str
    total_amount: float
    payment_method: str
    payment_status: str
    status: str
    created_at: datetime
    items: list[PurchaseOrderItemOut]


# ---------------- MATERIAL PURCHASE SCHEMAS ----------------

class MaterialCartItemCreate(BaseModel):
    material_id: int
    quantity: int = Field(default=1, ge=1, le=100)


class MaterialCheckoutCreate(BaseModel):
    phone: str = Field(min_length=10, max_length=20)
    address: str = Field(min_length=5, max_length=500)
    city: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)
    pincode: str = Field(min_length=6, max_length=10)
    payment_method: Literal["Cash on Delivery"] = "Cash on Delivery"


class MaterialPurchaseOrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    material_id: int
    material_name: str
    price: float
    quantity: int


class MaterialPurchaseOrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    customer_name: str
    customer_email: str
    phone: str
    address: str
    city: str
    state: str
    pincode: str
    total_amount: float
    payment_method: str
    payment_status: str
    status: str
    created_at: datetime
    items: list[MaterialPurchaseOrderItemOut]


# ---------------- ORDER TRACKING SCHEMAS ----------------

class TrackingHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_type: str
    order_id: int
    item_id: Optional[int] = None
    status: str
    note: str = ""
    updated_by_user_id: int
    created_at: datetime


class TrackingStatusUpdate(BaseModel):
    status: Literal[
        "Placed",
        "Pending",
        "Accepted",
        "Rejected",
        "In Progress",
        "Packed",
        "Shipped",
        "Out for Delivery",
        "Completed",
        "Delivered",
        "Cancelled"
    ]
    note: str = Field(default="", max_length=500)

# ---------------- AI PRICE RECOMMENDATION ----------------

class PriceRecommendationRequest(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    category: str = Field(min_length=2, max_length=100)
    material_cost: float = Field(ge=0)
    labour_cost: float = Field(ge=0)
    other_cost: float = Field(ge=0)
    hours_required: float = Field(ge=0)


class PriceRecommendationResponse(BaseModel):
    total_cost: float
    minimum_price: float
    recommended_price: float
    estimated_profit: float
    profit_margin: float
    explanation: str
    mode: Literal["ai", "demo"]
    note: str


# ---------------- AI CUSTOM DESIGN ASSISTANT ----------------

class CustomDesignRequest(BaseModel):
    idea: str = Field(min_length=5, max_length=2000)
    category: str = Field(default="", max_length=100)
    preferred_material: str = Field(default="", max_length=200)
    preferred_colour: str = Field(default="", max_length=150)
    budget: float = Field(default=0, ge=0)


class CustomDesignResponse(BaseModel):
    product_name: str
    category: str
    materials: list[str]
    colours: list[str]
    size: str
    style: str
    design_description: str
    customization_suggestions: list[str]
    requirements: str
    mode: Literal["ai", "demo"]
    note: str
