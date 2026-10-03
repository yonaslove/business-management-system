from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: str


class RegisterRequest(BaseModel):
    business_name: str
    owner_name: str
    username: Optional[str] = None
    email: EmailStr
    password: str
    phone: Optional[str] = None
    address: Optional[str] = None
    currency: Optional[str] = "ETB"
    currency_symbol: Optional[str] = "Br"


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class TokenPayload(BaseModel):
    sub: Optional[str] = None
