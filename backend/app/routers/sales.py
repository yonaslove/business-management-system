from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.session import get_db
from app.models.user import User
from app.models.product import Product
from app.models.customer import Customer
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.schemas.sale import SaleCreate, SaleOut
from app.routers.deps import get_current_user

router = APIRouter(prefix="/sales", tags=["Sales"])


def serialize_sale(s: Sale) -> dict:
    return {
        "id": s.id,
        "business_id": s.business_id,
        "customer_id": s.customer_id,
        "customer_name": s.customer.name if s.customer else "Walk-in Customer",
        "total_amount": s.total_amount,
        "payment_method": s.payment_method,
        "notes": s.notes,
        "created_at": s.created_at,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": item.subtotal
            }
            for item in s.items
        ]
    }


@router.get("", response_model=List[SaleOut])
def list_sales(
    search: Optional[str] = Query(None, description="Search by customer name or notes"),
    customer_id: Optional[int] = Query(None, description="Filter by customer ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Sale).filter(Sale.business_id == current_user.business_id)

    if customer_id:
        query = query.filter(Sale.customer_id == customer_id)

    sales = query.order_by(desc(Sale.created_at)).all()

    result = []
    for s in sales:
        serialized = serialize_sale(s)
        if search:
            s_term = search.lower().strip()
            name_match = serialized["customer_name"] and s_term in serialized["customer_name"].lower()
            notes_match = serialized["notes"] and s_term in serialized["notes"].lower()
            if not (name_match or notes_match):
                continue
        result.append(serialized)

    return result


@router.get("/{sale_id}", response_model=SaleOut)
def get_sale(
    sale_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sale = db.query(Sale).filter(
        Sale.id == sale_id,
        Sale.business_id == current_user.business_id
    ).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale record not found")
    return serialize_sale(sale)


@router.post("", response_model=SaleOut, status_code=status.HTTP_201_CREATED)
def create_sale(
    sale_in: SaleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Critical Transaction:
    1. Verify customer if specified
    2. Lock/verify product stock for each item
    3. Fail atomically if any product has insufficient stock
    4. Decrement inventory stock
    5. Save Sale and SaleItems
    """
    if not sale_in.items:
        raise HTTPException(status_code=400, detail="Cannot record an empty sale. Add at least one product.")

    # Validate Customer if provided
    if sale_in.customer_id:
        customer = db.query(Customer).filter(
            Customer.id == sale_in.customer_id,
            Customer.business_id == current_user.business_id
        ).first()
        if not customer:
            raise HTTPException(status_code=400, detail="Selected customer does not exist")

    # Start transactional verification
    total_sale_amount = 0.0
    items_to_create = []

    # Map product IDs to check for duplicates in the request
    requested_product_counts = {}
    for item in sale_in.items:
        if item.quantity <= 0:
            raise HTTPException(status_code=400, detail=f"Quantity for product must be greater than 0")
        requested_product_counts[item.product_id] = requested_product_counts.get(item.product_id, 0) + item.quantity

    # Validate all requested items against inventory
    for prod_id, total_qty_requested in requested_product_counts.items():
        product = db.query(Product).filter(
            Product.id == prod_id,
            Product.business_id == current_user.business_id
        ).with_for_update().first() if not db.bind.name == "sqlite" else db.query(Product).filter(
            Product.id == prod_id,
            Product.business_id == current_user.business_id
        ).first()

        if not product:
            raise HTTPException(status_code=404, detail=f"Product with ID {prod_id} not found")

        if product.stock_quantity < total_qty_requested:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.stock_quantity}, requested: {total_qty_requested}."
            )

        # Decrement stock
        product.stock_quantity -= total_qty_requested

        subtotal = round(product.price * total_qty_requested, 2)
        total_sale_amount += subtotal

        items_to_create.append({
            "product_id": product.id,
            "product_name": product.name,
            "quantity": total_qty_requested,
            "unit_price": product.price,
            "subtotal": subtotal
        })

    # Create Sale
    sale = Sale(
        business_id=current_user.business_id,
        customer_id=sale_in.customer_id,
        total_amount=round(total_sale_amount, 2),
        payment_method=sale_in.payment_method or "Cash",
        notes=sale_in.notes.strip() if sale_in.notes else None
    )
    db.add(sale)
    db.flush()

    for item_data in items_to_create:
        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=item_data["product_id"],
            product_name=item_data["product_name"],
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            subtotal=item_data["subtotal"]
        )
        db.add(sale_item)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Transaction failed: {str(e)}")

    db.refresh(sale)
    return serialize_sale(sale)
