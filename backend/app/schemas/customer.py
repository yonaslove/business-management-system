from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1)
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class CustomerOut(CustomerBase):
    id: int
    business_id: int
    is_verified: bool = True
    total_purchases: float = 0.0
    sales_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerUpdateOut(CustomerOut):
    message: Optional[str] = None
    status: Optional[str] = "UPDATED"  # "UPDATED" or "PENDING_APPROVAL"

