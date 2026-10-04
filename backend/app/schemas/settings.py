from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List


class CurrencyInfo(BaseModel):
    code: str
    name: str
    symbol: str


class BusinessSettingsOut(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    currency: str = "ETB"
    currency_symbol: str = "Br"

    # Online Payment Accounts
    payment_phone: Optional[str] = None
    payment_account_name: Optional[str] = None
    cbe_account: Optional[str] = None
    other_bank_info: Optional[str] = None
    payment_instructions: Optional[str] = None

    available_currencies: List[CurrencyInfo]

    model_config = ConfigDict(from_attributes=True)


class BusinessSettingsUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    currency: Optional[str] = None
    currency_symbol: Optional[str] = None

    # Online Payment Accounts
    payment_phone: Optional[str] = None
    payment_account_name: Optional[str] = None
    cbe_account: Optional[str] = None
    other_bank_info: Optional[str] = None
    payment_instructions: Optional[str] = None


class SettingsResponse(BaseModel):
    status: str  # UPDATED, PENDING_APPROVAL
    message: str
    settings: Optional[BusinessSettingsOut] = None
