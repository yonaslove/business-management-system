from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime


class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)


class SaleItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    unit_price: float
    subtotal: float

    model_config = ConfigDict(from_attributes=True)


class SaleCreate(BaseModel):
    customer_id: Optional[int] = None
    items: List[SaleItemCreate] = Field(..., min_length=1)
    payment_method: str = "Cash"
    notes: Optional[str] = None


class SaleOut(BaseModel):
    id: int
    business_id: int
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    total_amount: float
    payment_method: str
    notes: Optional[str] = None
    payment_receipt: Optional[str] = None
    payment_ref: Optional[str] = None
    delivery_notes: Optional[str] = None
    delivery_user_name: Optional[str] = None
    delivery_proof_image: Optional[str] = None
    customer_acknowledged: Optional[bool] = False
    customer_acknowledged_at: Optional[datetime] = None
    customer_feedback: Optional[str] = None
    is_online: Optional[bool] = False
    order_status: Optional[str] = "COMPLETED"
    created_at: datetime
    items: List[SaleItemOut] = []

    model_config = ConfigDict(from_attributes=True)


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(PENDING_VERIFICATION|VERIFIED|CONFIRMED|DISPATCHED|DELIVERED|CANCELLED|REJECTED)$")
    notes: Optional[str] = None
    delivery_notes: Optional[str] = None



