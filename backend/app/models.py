"""SQLAlchemy tables."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # customer or creator
    is_active = Column(Integer, default=1)

    creator_id = Column(Integer, ForeignKey("creators.id"), nullable=True)
    creator = relationship("Creator", foreign_keys=[creator_id])

class Creator(Base):
    __tablename__ = "creators"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    bio = Column(Text, default="")
    specialty = Column(String(100), default="")
    location = Column(String(100), default="")
    products = relationship("Product", back_populates="creator", cascade="all, delete-orphan")
    profile_image = Column(String(500), default="")
    cover_image = Column(String(500), default="")
    portfolio_items = relationship(
        "PortfolioItem",
        back_populates="creator",
        cascade="all, delete-orphan"
    )

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False, index=True)
    price = Column(Float, nullable=False)
    description = Column(Text, default="")
    material = Column(String(100), default="")
    colour = Column(String(50), default="")
    image = Column(String(500), default="")
    try_on_image = Column(String(500), default="")
    creator_id = Column(Integer, ForeignKey("creators.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    creator = relationship("Creator", back_populates="products")

    @property
    def creator_name(self):
        return self.creator.name if self.creator else ""


class Material(Base):
    __tablename__ = "materials"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False, index=True)
    price = Column(Float, nullable=False)
    description = Column(Text, default="")
    image = Column(String(500), default="")


class CustomOrder(Base):
    __tablename__ = "custom_orders"
    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String(100), nullable=False)
    customer_email = Column(String(150), nullable=False, index=True)
    creator_id = Column(Integer, ForeignKey("creators.id"), nullable=False)
    category = Column(String(50), nullable=False)
    material = Column(String(100), default="")
    colour = Column(String(50), default="")
    size = Column(String(50), default="")
    quantity = Column(Integer, default=1)
    budget = Column(Float, default=0)
    requirements = Column(Text, default="")
    design_description = Column(Text, default="")
    preview_image = Column(Text, nullable=True)
    status = Column(String(30), default="Pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    creator = relationship("Creator")

    @property
    def creator_name(self):
        return self.creator.name if self.creator else ""

class PortfolioItem(Base):
    __tablename__ = "portfolio_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, default="")
    image = Column(String(500), nullable=False)
    creator_id = Column(Integer, ForeignKey("creators.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    creator = relationship("Creator", back_populates="portfolio_items")


# ---------------- CUSTOMER REVIEWS ----------------

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(
        Integer,
        ForeignKey("custom_orders.id"),
        nullable=False,
        unique=True
    )
    creator_id = Column(
        Integer,
        ForeignKey("creators.id"),
        nullable=False,
        index=True
    )
    customer_name = Column(String(100), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=False)
    photo_urls = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("CustomOrder")
    creator = relationship("Creator")

# ---------------- CUSTOMER WISHLIST ----------------

class Wishlist(Base):
    __tablename__ = "wishlists"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False,
        index=True
    )

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    product = relationship("Product")


# ---------------- SHOPPING CART ----------------

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False,
        index=True
    )

    quantity = Column(Integer, default=1, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    product = relationship("Product")


# ---------------- PURCHASE ORDERS ----------------

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    customer_name = Column(String(100), nullable=False)
    customer_email = Column(String(150), nullable=False)
    phone = Column(String(20), nullable=False)

    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False)

    total_amount = Column(Float, nullable=False)

    payment_method = Column(String(30), default="Cash on Delivery")
    payment_status = Column(String(30), default="Pending")
    status = Column(String(30), default="Placed")

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    items = relationship(
        "PurchaseOrderItem",
        back_populates="order",
        cascade="all, delete-orphan"
    )


# ---------------- PURCHASE ORDER ITEMS ----------------

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(Integer, primary_key=True, index=True)

    order_id = Column(
        Integer,
        ForeignKey("purchase_orders.id"),
        nullable=False,
        index=True
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    product_name = Column(String(150), nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)

    order = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product")


# ---------------- CREATOR-CUSTOMER CHAT ----------------

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)

    customer_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    creator_id = Column(
        Integer,
        ForeignKey("creators.id"),
        nullable=False,
        index=True
    )

    order_id = Column(
        Integer,
        ForeignKey("custom_orders.id"),
        nullable=True
    )

    sender_role = Column(String(20), nullable=False)
    message = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    customer = relationship("User")
    creator = relationship("Creator")
    order = relationship("CustomOrder")

# ---------------- MATERIAL PURCHASE ORDERS ----------------

class MaterialPurchaseOrder(Base):
    __tablename__ = "material_purchase_orders"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    customer_name = Column(String(100), nullable=False)
    customer_email = Column(String(150), nullable=False)
    phone = Column(String(20), nullable=False)

    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False)

    total_amount = Column(Float, nullable=False)

    payment_method = Column(String(30), default="Cash on Delivery")
    payment_status = Column(String(30), default="Pending")
    status = Column(String(30), default="Placed")

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    items = relationship(
        "MaterialPurchaseOrderItem",
        back_populates="order",
        cascade="all, delete-orphan"
    )


class MaterialPurchaseOrderItem(Base):
    __tablename__ = "material_purchase_order_items"

    id = Column(Integer, primary_key=True, index=True)

    order_id = Column(
        Integer,
        ForeignKey("material_purchase_orders.id"),
        nullable=False,
        index=True
    )

    material_id = Column(
        Integer,
        ForeignKey("materials.id"),
        nullable=False
    )

    material_name = Column(String(150), nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)

    order = relationship("MaterialPurchaseOrder", back_populates="items")
    material = relationship("Material")


# ---------------- ORDER STATUS HISTORY ----------------

class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"

    id = Column(Integer, primary_key=True, index=True)

    order_type = Column(String(30), nullable=False, index=True)
    order_id = Column(Integer, nullable=False, index=True)
    item_id = Column(Integer, nullable=True, index=True)

    status = Column(String(30), nullable=False)
    note = Column(Text, default="")

    updated_by_user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    created_at = Column(DateTime, default=datetime.utcnow)

    updated_by = relationship("User")
