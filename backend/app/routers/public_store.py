from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.session import get_db
from app.models.business import Business
from app.models.product import Product
from app.models.category import Category
from app.models.customer import Customer
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.activity_log import ActivityLog
from app.models.user import User
from app.core.security import get_password_hash, verify_password

router = APIRouter(prefix="/public", tags=["Public Online Store & Customer Ordering"])


class PublicOrderItem(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)


class PublicOrderCreate(BaseModel):
    business_id: Optional[int] = None
    customer_name: str = Field(..., min_length=2)
    customer_phone: str = Field(..., min_length=4)
    delivery_address: str = Field(..., min_length=3)
    payment_method: str = Field(default="Cash on Delivery")
    payment_receipt: Optional[str] = None  # Base64 image/pdf data URL
    payment_ref: Optional[str] = None  # Bank reference ID
    notes: Optional[str] = None
    items: List[PublicOrderItem] = Field(..., min_items=1)



@router.get("/store")
def get_public_store_data(
    business_id: Optional[int] = Query(None, description="Specific business ID to view catalog for"),
    db: Session = Depends(get_db)
):
    """
    Returns public store information, categories, and verified products for online shoppers.
    """
    if business_id:
        biz = db.query(Business).filter(Business.id == business_id).first()
    else:
        # Pick the most recent business that has inventory products
        biz = db.query(Business).join(Product, Product.business_id == Business.id).order_by(desc(Business.id)).first()
        if not biz:
            biz = db.query(Business).order_by(desc(Business.id)).first()

    if not biz:
        raise HTTPException(status_code=404, detail="No business profile found.")

    categories = db.query(Category).filter(Category.business_id == biz.id).all()
    products = db.query(Product).filter(
        Product.business_id == biz.id,
        Product.is_verified == True
    ).order_by(Product.name.asc()).all()

    def calc_status(stock: int, threshold: int) -> str:
        if stock <= 0:
            return "EMPTY"
        elif stock <= threshold:
            return "LOW STOCK"
        return "IN STOCK"

    return {
        "business": {
            "id": biz.id,
            "name": biz.name,
            "phone": biz.phone,
            "email": biz.email,
            "address": biz.address,
            "currency": biz.currency or "ETB",
            "currency_symbol": biz.currency_symbol or "Br"
        },
        "categories": [
            {"id": c.id, "name": c.name}
            for c in categories
        ],
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "price": float(p.price),
                "stock_quantity": p.stock_quantity,
                "category_id": p.category_id,
                "category_name": p.category.name if p.category else "General",
                "stock_status": calc_status(p.stock_quantity, p.low_stock_threshold),
                "is_available": p.stock_quantity > 0
            }
            for p in products
        ]
    }


@router.post("/orders", status_code=status.HTTP_201_CREATED)
def place_online_order(
    order_in: PublicOrderCreate,
    db: Session = Depends(get_db)
):
    """
    Allows any online visitor/customer to place an order directly from the landing page.
    Deducts stock, creates customer record, generates sale & sale items, and logs an activity.
    """
    # 1. Determine target business
    if order_in.business_id:
        biz = db.query(Business).filter(Business.id == order_in.business_id).first()
    else:
        first_item_id = order_in.items[0].product_id
        first_prod = db.query(Product).filter(Product.id == first_item_id).first()
        if first_prod:
            biz = db.query(Business).filter(Business.id == first_prod.business_id).first()
        else:
            biz = db.query(Business).order_by(desc(Business.id)).first()

    if not biz:
        raise HTTPException(status_code=404, detail="Store is currently offline.")

    # 2. Validate items and lock stock
    total_amount = 0.0
    items_to_process = []

    for item_req in order_in.items:
        prod = db.query(Product).filter(
            Product.id == item_req.product_id,
            Product.business_id == biz.id
        ).with_for_update().first()

        if not prod:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product ID #{item_req.product_id} was not found."
            )

        if not prod.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product '{prod.name}' is pending admin verification and cannot be ordered online."
            )

        if prod.stock_quantity < item_req.quantity:
            avail = prod.stock_quantity
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for '{prod.name}'. Only {avail} unit(s) remaining in store."
            )

        subtotal = float(prod.price) * item_req.quantity
        total_amount += subtotal
        items_to_process.append((prod, item_req.quantity, subtotal))

    # 3. Find or register Customer
    clean_phone = order_in.customer_phone.strip()
    clean_name = order_in.customer_name.strip()
    customer = db.query(Customer).filter(
        Customer.business_id == biz.id,
        Customer.phone == clean_phone
    ).first()

    if not customer:
        customer = Customer(
            business_id=biz.id,
            name=clean_name,
            phone=clean_phone,
            address=order_in.delivery_address.strip(),
            notes="Registered via Online Landing Page Storefront",
            is_verified=True
        )
        db.add(customer)
        db.flush()
    else:
        if not customer.address and order_in.delivery_address:
            customer.address = order_in.delivery_address.strip()

    # 4. Create Sale Record
    status_tag = "[PENDING_VERIFICATION]"
    notes_combined = f"{status_tag} Online Order. Delivery to: {order_in.delivery_address.strip()}."
    if order_in.payment_ref:
        notes_combined += f" Bank Ref: {order_in.payment_ref.strip()}."
    if order_in.notes:
        notes_combined += f" Note: {order_in.notes.strip()}"

    sale = Sale(
        business_id=biz.id,
        customer_id=customer.id,
        user_id=None,  # Online customer self-checkout
        total_amount=round(total_amount, 2),
        payment_method=order_in.payment_method.strip(),
        notes=notes_combined,
        payment_receipt=order_in.payment_receipt,
        payment_ref=order_in.payment_ref.strip() if order_in.payment_ref else None
    )
    db.add(sale)
    db.flush()

    # 5. Create Sale Items and decrement stock
    order_items_summary = []
    for prod, qty, subtotal in items_to_process:
        prod.stock_quantity -= qty

        item_row = SaleItem(
            sale_id=sale.id,
            product_id=prod.id,
            product_name=prod.name,
            quantity=qty,
            unit_price=float(prod.price),
            subtotal=round(subtotal, 2)
        )
        db.add(item_row)
        order_items_summary.append({
            "product_name": prod.name,
            "quantity": qty,
            "unit_price": float(prod.price),
            "subtotal": round(subtotal, 2)
        })

    # 6. Log Activity for Admin & Staff Hub
    admin_user = db.query(User).filter(User.business_id == biz.id).first()
    curr_sym = biz.currency_symbol or "Br"
    if admin_user:
        has_receipt_text = "Bank receipt screenshot attached" if order_in.payment_receipt else "No receipt attached"
        log = ActivityLog(
            business_id=biz.id,
            user_id=admin_user.id,
            user_name=f"Online Customer: {clean_name}",
            action="ONLINE_ORDER_PLACED",
            entity_type="sale",
            entity_id=sale.id,
            entity_name=f"Order #{sale.id}",
            details=(
                f"Online customer {clean_name} ({clean_phone}) submitted order #{sale.id} "
                f"for {curr_sym} {total_amount:,.2f} via {order_in.payment_method} ({has_receipt_text}). "
                f"Requires Admin/Co-Admin verification before delivery."
            ),
            status="LOGGED"
        )
        db.add(log)

    db.commit()
    db.refresh(sale)

    return {
        "status": "SUCCESS",
        "order_id": sale.id,
        "order_status": "PENDING_VERIFICATION",
        "customer_name": clean_name,
        "customer_phone": clean_phone,
        "delivery_address": order_in.delivery_address.strip(),
        "total_amount": round(total_amount, 2),
        "currency": biz.currency or "ETB",
        "currency_symbol": curr_sym,
        "payment_method": order_in.payment_method,
        "payment_ref": order_in.payment_ref,
        "has_receipt": bool(order_in.payment_receipt),
        "items": order_items_summary,
        "created_at": sale.created_at.isoformat() if sale.created_at else datetime.now(timezone.utc).isoformat(),
        "message": "Thank you! Your online order and payment details have been submitted. Store management will verify your payment and dispatch to delivery."
    }


class CustomerAuthRegister(BaseModel):
    business_id: Optional[int] = None
    name: str = Field(..., min_length=2)
    phone: str = Field(..., min_length=4)
    email: Optional[str] = None
    address: Optional[str] = None
    password: str = Field(..., min_length=6)


class CustomerAuthLogin(BaseModel):
    business_id: Optional[int] = None
    phone: str = Field(..., min_length=4)
    password: str = Field(..., min_length=4)


class CustomerDeliveryProofCreate(BaseModel):
    customer_phone: str = Field(..., min_length=4)
    proof_image: str  # Base64 photo data URL
    notes: Optional[str] = None


@router.post("/customer/register")
def register_customer(
    auth_in: CustomerAuthRegister,
    db: Session = Depends(get_db)
):
    biz_id = auth_in.business_id
    if not biz_id:
        first_biz = db.query(Business).order_by(desc(Business.id)).first()
        if not first_biz:
            raise HTTPException(status_code=404, detail="Store is currently offline.")
        biz_id = first_biz.id

    clean_phone = auth_in.phone.strip()
    customer = db.query(Customer).filter(
        Customer.business_id == biz_id,
        Customer.phone == clean_phone
    ).first()

    pwd_hash = get_password_hash(auth_in.password)

    if customer:
        customer.name = auth_in.name.strip()
        customer.password_hash = pwd_hash
        if auth_in.address:
            customer.address = auth_in.address.strip()
        if auth_in.email:
            customer.email = auth_in.email.strip()
    else:
        customer = Customer(
            business_id=biz_id,
            name=auth_in.name.strip(),
            phone=clean_phone,
            email=auth_in.email.strip() if auth_in.email else None,
            address=auth_in.address.strip() if auth_in.address else None,
            password_hash=pwd_hash,
            notes="Registered via Online Customer Portal",
            is_verified=True
        )
        db.add(customer)

    db.commit()
    db.refresh(customer)

    return {
        "status": "SUCCESS",
        "customer": {
            "id": customer.id,
            "name": customer.name,
            "phone": customer.phone,
            "email": customer.email,
            "address": customer.address
        },
        "message": "Customer account created successfully."
    }


@router.post("/customer/login")
def login_customer(
    auth_in: CustomerAuthLogin,
    db: Session = Depends(get_db)
):
    clean_phone = auth_in.phone.strip()
    query = db.query(Customer).filter(Customer.phone == clean_phone)
    if auth_in.business_id:
        query = query.filter(Customer.business_id == auth_in.business_id)

    customer = query.first()
    if not customer or not customer.password_hash or not verify_password(auth_in.password, customer.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password. Please try again or create an account."
        )

    return {
        "status": "SUCCESS",
        "customer": {
            "id": customer.id,
            "name": customer.name,
            "phone": customer.phone,
            "email": customer.email,
            "address": customer.address
        },
        "message": f"Welcome back, {customer.name}!"
    }


@router.get("/customer/orders")
def get_customer_orders(
    phone: str = Query(..., description="Customer phone number"),
    business_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    clean_phone = phone.strip()
    query = db.query(Customer).filter(Customer.phone == clean_phone)
    if business_id:
        query = query.filter(Customer.business_id == business_id)

    customers = query.all()
    if not customers:
        return []

    cust_ids = [c.id for c in customers]
    sales = db.query(Sale).filter(Sale.customer_id.in_(cust_ids)).order_by(desc(Sale.created_at)).all()

    from app.routers.sales import serialize_sale
    return [serialize_sale(s) for s in sales]


@router.post("/orders/{sale_id}/acknowledge")
def acknowledge_delivery_proof(
    sale_id: int,
    proof_in: CustomerDeliveryProofCreate,
    db: Session = Depends(get_db)
):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Order not found.")

    clean_phone = proof_in.customer_phone.strip()
    if sale.customer and sale.customer.phone and sale.customer.phone != clean_phone:
        raise HTTPException(status_code=403, detail="Phone number does not match order record.")

    sale.delivery_proof_image = proof_in.proof_image
    sale.customer_acknowledged = True
    sale.customer_acknowledged_at = datetime.now(timezone.utc)
    if proof_in.notes:
        sale.customer_feedback = proof_in.notes.strip()

    # Append acknowledgment tag
    existing_notes = sale.notes or ""
    if "[CUSTOMER_ACKNOWLEDGED]" not in existing_notes:
        sale.notes = f"[CUSTOMER_ACKNOWLEDGED] {existing_notes}".strip()

    # Log activity for management and staff
    cust_name = sale.customer.name if sale.customer else "Customer"
    admin_user = db.query(User).filter(User.business_id == sale.business_id).first()
    if admin_user:
        log = ActivityLog(
            business_id=sale.business_id,
            user_id=admin_user.id,
            user_name=f"Customer: {cust_name}",
            action="CUSTOMER_DELIVERY_ACKNOWLEDGED",
            entity_type="sale",
            entity_id=sale.id,
            entity_name=f"Order #{sale.id}",
            details=(
                f"Customer {cust_name} ({clean_phone}) confirmed receipt of Order #{sale.id} "
                f"and uploaded delivery proof image. Feedback: {proof_in.notes or 'None'}"
            ),
            status="LOGGED"
        )
        db.add(log)

    db.commit()
    db.refresh(sale)

    from app.routers.sales import serialize_sale
    return {
        "status": "SUCCESS",
        "order": serialize_sale(sale),
        "message": "Thank you! Your delivery confirmation and proof photo have been received by store management."
    }
