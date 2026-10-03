from typing import List
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database.session import get_db
from app.models.user import User
from app.models.product import Product
from app.models.customer import Customer
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.schemas.dashboard import (
    DashboardSummary,
    SalesChartPoint,
    DashboardRecentSale,
    DashboardLowStockProduct
)
from app.routers.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bid = current_user.business_id

    rev_res = db.query(func.coalesce(func.sum(Sale.total_amount), 0.0)).filter(Sale.business_id == bid).scalar()
    sales_cnt = db.query(func.count(Sale.id)).filter(Sale.business_id == bid).scalar() or 0
    prod_cnt = db.query(func.count(Product.id)).filter(Product.business_id == bid).scalar() or 0
    cust_cnt = db.query(func.count(Customer.id)).filter(Customer.business_id == bid).scalar() or 0

    low_stock_cnt = db.query(func.count(Product.id)).filter(
        Product.business_id == bid,
        Product.stock_quantity <= Product.low_stock_threshold
    ).scalar() or 0

    return {
        "total_revenue": float(rev_res),
        "total_sales": int(sales_cnt),
        "total_products": int(prod_cnt),
        "low_stock_count": int(low_stock_cnt),
        "total_customers": int(cust_cnt)
    }


@router.get("/sales", response_model=List[SalesChartPoint])
def get_sales_chart_data(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bid = current_user.business_id
    today = datetime.now(timezone.utc).date()
    start_date = today - timedelta(days=days - 1)

    # Initialize daily buckets
    buckets = {}
    for i in range(days):
        d = start_date + timedelta(days=i)
        buckets[d.strftime("%Y-%m-%d")] = {"amount": 0.0, "order_count": 0}

    sales = db.query(Sale).filter(
        Sale.business_id == bid,
        Sale.created_at >= datetime(start_date.year, start_date.month, start_date.day)
    ).all()

    for s in sales:
        d_str = s.created_at.strftime("%Y-%m-%d")
        if d_str in buckets:
            buckets[d_str]["amount"] += s.total_amount
            buckets[d_str]["order_count"] += 1

    chart_points = []
    for d_str, data in sorted(buckets.items()):
        chart_points.append({
            "date": d_str,
            "amount": round(data["amount"], 2),
            "order_count": data["order_count"]
        })

    return chart_points


@router.get("/recent-sales", response_model=List[DashboardRecentSale])
def get_recent_sales(
    limit: int = 5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sales = db.query(Sale).filter(
        Sale.business_id == current_user.business_id
    ).order_by(desc(Sale.created_at)).limit(limit).all()

    result = []
    for s in sales:
        total_items = sum(item.quantity for item in s.items)
        result.append({
            "id": s.id,
            "customer_name": s.customer.name if s.customer else "Walk-in Customer",
            "item_count": total_items,
            "total_amount": s.total_amount,
            "payment_method": s.payment_method,
            "created_at": s.created_at
        })
    return result


@router.get("/low-stock", response_model=List[DashboardLowStockProduct])
def get_low_stock_products(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    products = db.query(Product).filter(
        Product.business_id == current_user.business_id,
        Product.stock_quantity <= Product.low_stock_threshold
    ).order_by(Product.stock_quantity.asc()).limit(limit).all()

    result = []
    for p in products:
        status_label = "EMPTY" if p.stock_quantity <= 0 else "LOW STOCK"
        result.append({
            "id": p.id,
            "name": p.name,
            "stock_quantity": p.stock_quantity,
            "low_stock_threshold": p.low_stock_threshold,
            "price": p.price,
            "category_name": p.category.name if p.category else "Uncategorized",
            "status": status_label
        })
    return result
