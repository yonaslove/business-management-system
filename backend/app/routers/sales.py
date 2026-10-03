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
from app.schemas.sale import SaleCreate, SaleOut, OrderStatusUpdate
from app.routers.deps import get_current_user

router = APIRouter(prefix="/sales", tags=["Sales"])


from app.models.activity_log import ActivityLog


def serialize_sale(s: Sale) -> dict:
    is_online = s.user_id is None or (bool(s.notes) and "Online Order" in s.notes)
    
    order_status = "COMPLETED"
    if is_online:
        order_status = "PENDING_VERIFICATION" if (s.payment_receipt or s.payment_ref) else "PENDING"
        if s.notes:
            if "[PENDING_VERIFICATION]" in s.notes:
                order_status = "PENDING_VERIFICATION"
            elif "[VERIFIED]" in s.notes:
                order_status = "VERIFIED"
            elif "[CONFIRMED]" in s.notes:
                order_status = "CONFIRMED"
            elif "[DISPATCHED]" in s.notes:
                order_status = "DISPATCHED"
            elif "[DELIVERED]" in s.notes or "[COMPLETED]" in s.notes:
                order_status = "DELIVERED"
            elif "[CANCELLED]" in s.notes:
                order_status = "CANCELLED"
            elif "[REJECTED]" in s.notes:
                order_status = "REJECTED"

    return {
        "id": s.id,
        "business_id": s.business_id,
        "customer_id": s.customer_id,
        "customer_name": s.customer.name if s.customer else "Walk-in Customer",
        "customer_phone": s.customer.phone if s.customer else None,
        "customer_address": s.customer.address if s.customer else None,
        "is_online": is_online,
        "order_status": order_status,
        "user_id": s.user_id,
        "user_name": s.user.name if s.user else ("Online Customer" if is_online else None),
        "total_amount": s.total_amount,
        "payment_method": s.payment_method,
        "notes": s.notes,
        "payment_receipt": s.payment_receipt,
        "payment_ref": s.payment_ref,
        "delivery_notes": s.delivery_notes,
        "delivery_user_name": s.delivery_user.name if s.delivery_user else None,
        "delivery_proof_image": s.delivery_proof_image,
        "customer_acknowledged": bool(s.customer_acknowledged),
        "customer_acknowledged_at": s.customer_acknowledged_at,
        "customer_feedback": s.customer_feedback,
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
    search: Optional[str] = Query(None, description="Search by customer name, phone, notes, or bank ref"),
    customer_id: Optional[int] = Query(None, description="Filter by customer ID"),
    online_only: Optional[bool] = Query(False, description="Filter for online orders only"),
    delivery_only: Optional[bool] = Query(False, description="Filter for delivery queue orders"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Sale).filter(Sale.business_id == current_user.business_id)

    if customer_id is not None and isinstance(customer_id, int):
        query = query.filter(Sale.customer_id == customer_id)

    is_online_flag = bool(online_only) and not hasattr(online_only, "default")
    is_delivery_flag = bool(delivery_only) and not hasattr(delivery_only, "default")

    if is_online_flag or is_delivery_flag or current_user.role == "delivery":
        query = query.filter(
            (Sale.user_id == None) | (Sale.notes.like("%Online Order%"))
        )

    sales = query.order_by(desc(Sale.created_at)).all()

    result = []
    for s in sales:
        serialized = serialize_sale(s)
        
        # If delivery worker or delivery_only flag, only show orders ready for or in delivery
        if is_delivery_flag or current_user.role == "delivery":
            if serialized["order_status"] not in ["VERIFIED", "CONFIRMED", "DISPATCHED", "DELIVERED"]:
                continue

        if search and isinstance(search, str):
            s_term = search.lower().strip()
            name_match = bool(serialized["customer_name"] and s_term in serialized["customer_name"].lower())
            phone_match = bool(serialized["customer_phone"] and s_term in serialized["customer_phone"].lower())
            notes_match = bool(serialized["notes"] and s_term in serialized["notes"].lower())
            ref_match = bool(serialized.get("payment_ref") and s_term in serialized["payment_ref"].lower())
            if not (name_match or phone_match or notes_match or ref_match):
                continue
        result.append(serialized)

    return result


@router.patch("/{sale_id}/status", response_model=SaleOut)
def update_order_status(
    sale_id: int,
    status_in: OrderStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sale = db.query(Sale).filter(
        Sale.id == sale_id,
        Sale.business_id == current_user.business_id
    ).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Order/Sale record not found.")

    # Permissions check:
    # 1. Admin/Co-Admin required for VERIFIED or REJECTED receipt decisions
    if status_in.status in ["VERIFIED", "REJECTED"] and current_user.role not in ["admin", "co_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Administrator or Co-Admin can verify or reject online payment receipts."
        )

    # Clean existing tags from notes
    existing_notes = sale.notes or ""
    for tag in ["[PENDING_VERIFICATION]", "[PENDING]", "[VERIFIED]", "[CONFIRMED]", "[DISPATCHED]", "[DELIVERED]", "[COMPLETED]", "[CANCELLED]", "[REJECTED]"]:
        existing_notes = existing_notes.replace(tag, "").strip()

    new_status_tag = f"[{status_in.status}]"
    extra_note = f" - {status_in.notes.strip()}" if status_in.notes else ""
    sale.notes = f"{new_status_tag} {existing_notes}{extra_note}".strip()

    # Track delivery metadata
    if status_in.delivery_notes:
        sale.delivery_notes = status_in.delivery_notes.strip()

    if status_in.status in ["DISPATCHED", "DELIVERED"]:
        sale.delivery_user_id = current_user.id

    # If cancelled or rejected, restore product stock
    if status_in.status in ["CANCELLED", "REJECTED"]:
        for item in sale.items:
            prod = db.query(Product).filter(Product.id == item.product_id).first()
            if prod:
                prod.stock_quantity += item.quantity

    # Log activity for management
    action_type = "VERIFY_ONLINE_PAYMENT" if status_in.status in ["VERIFIED", "REJECTED"] else "UPDATE_ORDER_STATUS"
    log = ActivityLog(
        business_id=current_user.business_id,
        user_id=current_user.id,
        user_name=current_user.name,
        action=action_type,
        entity_type="sale",
        entity_id=sale.id,
        entity_name=f"Order #{sale.id}",
        details=f"{current_user.name} ({current_user.role}) transitioned Order #{sale.id} to {status_in.status}. Delivery Note: {status_in.delivery_notes or 'None'}",
        status="LOGGED"
    )
    db.add(log)
    db.commit()
    db.refresh(sale)
    return serialize_sale(sale)



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
    3. Fail atomically if any product has insufficient stock or is unverified / empty
    4. Decrement inventory stock
    5. Save Sale and SaleItems
    6. Log staff activity if executed by employee/co-admin
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
        if not customer.is_verified:
            raise HTTPException(
                status_code=400,
                detail=f"Customer '{customer.name}' is pending administrator verification and cannot be linked to sales yet."
            )

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

        # Must be verified by admin before selling
        if not product.is_verified:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot sell '{product.name}'. Product is pending administrator verification."
            )

        if product.stock_quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot sell '{product.name}'. Product is EMPTY (0 units in stock)."
            )

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
        user_id=current_user.id,
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

    # If made by employee or co_admin, log activity for admin notification
    if current_user.role != "admin":
        act_log = ActivityLog(
            business_id=current_user.business_id,
            user_id=current_user.id,
            user_name=current_user.name,
            action="SALE_RECORDED",
            entity_type="sale",
            entity_id=sale.id,
            entity_name=f"Sale #{sale.id}",
            details=f"Staff member {current_user.name} ({current_user.role}) processed sale #{sale.id} ({sale.payment_method}, total: {sale.total_amount:.2f}).",
            status="LOGGED"
        )
        db.add(act_log)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Transaction failed: {str(e)}")

    db.refresh(sale)
    return serialize_sale(sale)

