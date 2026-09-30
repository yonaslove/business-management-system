from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class CategoryBase(BaseModel):
    name: str


class CategoryCreate(CategoryBase):
    pass


class CategoryOut(CategoryBase):
    id: int
    business_id: int

    model_config = ConfigDict(from_attributes=True)


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    price: float = Field(..., ge=0.0)
    stock_quantity: int = Field(..., ge=0)
    low_stock_threshold: int = Field(default=10, ge=0)
    category_id: Optional[int] = None
    sku: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(None, ge=0.0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    category_id: Optional[int] = None
    sku: Optional[str] = None


class ProductOut(ProductBase):
    id: int
    business_id: int
    stock_status: str = "IN STOCK"  # IN STOCK, LOW STOCK, OUT OF STOCK
    category_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductUpdateOut(ProductOut):
    message: Optional[str] = None
    status: Optional[str] = "UPDATED"  # "UPDATED" or "PENDING_APPROVAL"
