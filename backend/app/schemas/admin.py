from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


class EmployeeCreate(BaseModel):
    name: str = Field(..., min_length=1)
    username: Optional[str] = None
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: str = Field(default="employee", pattern="^(admin|co_admin|employee|delivery)$")



class EmployeeOut(BaseModel):
    id: int
    name: str
    username: Optional[str] = None
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
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    entity_name: str
    details: str
    payload: Optional[str] = None
    status: str  # PENDING_APPROVAL, APPROVED, DISMISSED, LOGGED
    user_role: Optional[str] = "employee"
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Daily Report Schemas
class DailyReportSummary(BaseModel):
    date: str
    total_revenue: float
    total_sales_count: int
    total_units_sold: int
    total_inventory_items: int
    total_remaining_stock: int
    empty_products_count: int
    low_stock_products_count: int
    currency: str
    currency_symbol: str


class StaffDailySales(BaseModel):
    user_id: Optional[int] = None
    user_name: str
    role: str
    sales_count: int
    units_sold: int
    total_revenue: float


class PaymentMethodDaily(BaseModel):
    method: str
    amount: float
    count: int
    percentage: float


class ItemSoldDaily(BaseModel):
    product_id: int
    product_name: str
    category_name: Optional[str] = None
    quantity_sold: int
    unit_price: float
    total_revenue: float


class InventoryStockDaily(BaseModel):
    product_id: int
    product_name: str
    category_name: Optional[str] = None
    price: float
    remaining_stock: int
    low_stock_threshold: int
    status: str  # IN STOCK, LOW STOCK, EMPTY
    is_verified: bool


class DailyReportOut(BaseModel):
    summary: DailyReportSummary
    staff_sales: List[StaffDailySales]
    payment_methods: List[PaymentMethodDaily]
    items_sold: List[ItemSoldDaily]
    inventory_status: List[InventoryStockDaily]


class AdminNotificationSummary(BaseModel):
    pending_approvals_count: int = 0
    pending_approvals: List[ActivityLogOut] = []
    recent_activities: List[ActivityLogOut] = []
    coadmin_activities_count: int = 0
    coadmin_activities: List[ActivityLogOut] = []
    pending_orders_count: int = 0
    pending_orders: List[ActivityLogOut] = []
    delivery_orders_count: int = 0
    delivery_orders: List[ActivityLogOut] = []
    total_notifications_count: int = 0
