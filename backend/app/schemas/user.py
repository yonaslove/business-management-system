from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime


class BusinessOut(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str = "admin"
    business_id: int
    business: Optional[BusinessOut] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
