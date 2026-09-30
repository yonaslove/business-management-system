from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime


class EmployeeCreate(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=4)
    role: str = Field(default="employee", pattern="^(admin|employee)$")


class EmployeeOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    business_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ActivityLogOut(BaseModel):
    id: int
    business_id: int
    user_id: int
    user_name: str
    action: str  # DELETE_REQUEST, DELETE_PERMANENT, PRICE_CHANGE, STOCK_UPDATE
    entity_type: str  # product, customer, sale
    entity_id: Optional[int] = None
    entity_name: str
    details: str
    status: str  # PENDING_APPROVAL, APPROVED, DISMISSED, LOGGED
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
