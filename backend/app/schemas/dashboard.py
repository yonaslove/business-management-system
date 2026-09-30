from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class DashboardSummary(BaseModel):
    total_revenue: float
    total_sales: int
    total_products: int
    low_stock_count: int
    total_customers: int


class SalesChartPoint(BaseModel):
    date: str
    amount: float
    order_count: int


class DashboardRecentSale(BaseModel):
    id: int
    customer_name: str
    item_count: int
    total_amount: float
    payment_method: str
    created_at: datetime


class DashboardLowStockProduct(BaseModel):
    id: int
    name: str
    stock_quantity: int
    low_stock_threshold: int
    price: float
    category_name: Optional[str] = None
    status: str
