"""SQLAlchemy tables."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


class Creator(Base):
    __tablename__ = "creators"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    bio = Column(Text, default="")
    specialty = Column(String(100), default="")
    location = Column(String(100), default="")
    products = relationship("Product", back_populates="creator", cascade="all, delete-orphan")


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
    status = Column(String(30), default="Pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    creator = relationship("Creator")

    @property
    def creator_name(self):
        return self.creator.name if self.creator else ""
