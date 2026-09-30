from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.database.session import get_db
from app.models.user import User
from app.models.customer import Customer
from app.models.sale import Sale
from app.models.activity_log import ActivityLog
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerOut
from app.routers.deps import get_current_user

router = APIRouter(prefix="/customers", tags=["Customers"])


def enrich_customer(c: Customer, db: Session) -> dict:
    sales_stats = db.query(
        func.coalesce(func.sum(Sale.total_amount), 0.0).label("total_spent"),
        func.count(Sale.id).label("sales_count")
    ).filter(Sale.customer_id == c.id).first()

    return {
        "id": c.id,
        "business_id": c.business_id,
        "name": c.name,
        "phone": c.phone,
        "email": c.email,
        "address": c.address,
        "notes": c.notes,
        "total_purchases": float(sales_stats.total_spent) if sales_stats else 0.0,
        "sales_count": int(sales_stats.sales_count) if sales_stats else 0,
        "created_at": c.created_at,
        "updated_at": c.updated_at
    }


@router.get("", response_model=List[CustomerOut])
def list_customers(
    search: Optional[str] = Query(None, description="Search by customer name, phone, or email"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Customer).filter(Customer.business_id == current_user.business_id)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(Customer.name.ilike(s), Customer.phone.ilike(s), Customer.email.ilike(s)))

    customers = query.order_by(Customer.name.asc()).all()
    return [enrich_customer(c, db) for c in customers]


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(
    customer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.business_id == current_user.business_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return enrich_customer(customer, db)


@router.post("", response_model=CustomerOut)
def create_customer(
    customer_in: CustomerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    customer = Customer(
        business_id=current_user.business_id,
        name=customer_in.name.strip(),
        phone=customer_in.phone.strip() if customer_in.phone else None,
        email=customer_in.email.strip() if customer_in.email else None,
        address=customer_in.address.strip() if customer_in.address else None,
        notes=customer_in.notes.strip() if customer_in.notes else None
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return enrich_customer(customer, db)


@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(
    customer_id: int,
    customer_in: CustomerUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.business_id == current_user.business_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if customer_in.name is not None:
        customer.name = customer_in.name.strip()
    if customer_in.phone is not None:
        customer.phone = customer_in.phone.strip() if customer_in.phone else None
    if customer_in.email is not None:
        customer.email = customer_in.email.strip() if customer_in.email else None
    if customer_in.address is not None:
        customer.address = customer_in.address.strip() if customer_in.address else None
    if customer_in.notes is not None:
        customer.notes = customer_in.notes.strip() if customer_in.notes else None

    db.commit()
    db.refresh(customer)
    return enrich_customer(customer, db)


@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id,
        Customer.business_id == current_user.business_id
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # If employee, report deletion request to admin
    if current_user.role != "admin":
        existing_req = db.query(ActivityLog).filter(
            ActivityLog.business_id == current_user.business_id,
            ActivityLog.entity_type == "customer",
            ActivityLog.entity_id == customer.id,
            ActivityLog.action == "DELETE_REQUEST",
            ActivityLog.status == "PENDING_APPROVAL"
        ).first()

        if existing_req:
            return {
                "message": "Deletion request for this customer is already pending administrator approval.",
                "status": "PENDING_APPROVAL"
            }

        log = ActivityLog(
            business_id=current_user.business_id,
            user_id=current_user.id,
            user_name=current_user.name,
            action="DELETE_REQUEST",
            entity_type="customer",
            entity_id=customer.id,
            entity_name=customer.name,
            details=f"Employee {current_user.name} requested permanent deletion of customer '{customer.name}'. Requires administrator approval.",
            status="PENDING_APPROVAL"
        )
        db.add(log)
        db.commit()
        return {
            "message": "Deletion request submitted to business admin for review. Only administrators can permanently delete customers.",
            "status": "PENDING_APPROVAL"
        }

    # Admin: permanently delete
    cust_name = customer.name
    db.delete(customer)

    log = ActivityLog(
        business_id=current_user.business_id,
        user_id=current_user.id,
        user_name=current_user.name,
        action="DELETE_PERMANENT",
        entity_type="customer",
        entity_id=customer_id,
        entity_name=cust_name,
        details=f"Admin {current_user.name} permanently deleted customer '{cust_name}'.",
        status="LOGGED"
    )
    db.add(log)
    db.commit()

    return {"message": "Customer permanently deleted by administrator.", "status": "DELETED"}
