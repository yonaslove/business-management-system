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


import json

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
        "is_verified": bool(c.is_verified),
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
    is_admin = current_user.role == "admin"
    is_coadmin = current_user.role == "co_admin"
    is_verified = is_admin or is_coadmin

    customer = Customer(
        business_id=current_user.business_id,
        name=customer_in.name.strip(),
        phone=customer_in.phone.strip() if customer_in.phone else None,
        email=customer_in.email.strip() if customer_in.email else None,
        address=customer_in.address.strip() if customer_in.address else None,
        notes=customer_in.notes.strip() if customer_in.notes else None,
        is_verified=is_verified
    )
    db.add(customer)
    db.flush()

    if is_coadmin:
        # Co-Manager adds customer directly, notifying admin
        log = ActivityLog(
            business_id=current_user.business_id,
            user_id=current_user.id,
            user_name=current_user.name,
            action="COADMIN_ADDED_CUSTOMER",
            entity_type="customer",
            entity_id=customer.id,
            entity_name=customer.name,
            details=f"Co-Manager {current_user.name} added customer '{customer.name}'. Verified and active.",
            payload=json.dumps({
                "customer_id": customer.id,
                "name": customer.name,
                "phone": customer.phone,
                "email": customer.email,
                "address": customer.address,
                "notes": customer.notes
            }),
            status="LOGGED"
        )
        db.add(log)
    elif not is_admin:
        # Regular employee requires admin verification
        log = ActivityLog(
            business_id=current_user.business_id,
            user_id=current_user.id,
            user_name=current_user.name,
            action="CREATE_CUSTOMER_REQUEST",
            entity_type="customer",
            entity_id=customer.id,
            entity_name=customer.name,
            details=f"Staff member {current_user.name} ({current_user.role}) added customer '{customer.name}'. Requires administrator verification.",
            payload=json.dumps({
                "customer_id": customer.id,
                "name": customer.name,
                "phone": customer.phone,
                "email": customer.email,
                "address": customer.address,
                "notes": customer.notes
            }),
            status="PENDING_APPROVAL"
        )
        db.add(log)
    else:
        # Admin logged
        log = ActivityLog(
            business_id=current_user.business_id,
            user_id=current_user.id,
            user_name=current_user.name,
            action="CREATE_CUSTOMER",
            entity_type="customer",
            entity_id=customer.id,
            entity_name=customer.name,
            details=f"Admin {current_user.name} added customer '{customer.name}'.",
            status="LOGGED"
        )
        db.add(log)

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

    # 1. EMPLOYEE ROLE: Cannot update directly; submits request for verification
    if current_user.role == "employee":
        payload_dict = {}
        if customer_in.name is not None and customer_in.name.strip() != customer.name:
            payload_dict["name"] = customer_in.name.strip()
        if customer_in.phone is not None and customer_in.phone.strip() != (customer.phone or ""):
            payload_dict["phone"] = customer_in.phone.strip()
        if customer_in.email is not None and customer_in.email.strip() != (customer.email or ""):
            payload_dict["email"] = customer_in.email.strip()
        if customer_in.address is not None and customer_in.address.strip() != (customer.address or ""):
            payload_dict["address"] = customer_in.address.strip()
        if customer_in.notes is not None and customer_in.notes.strip() != (customer.notes or ""):
            payload_dict["notes"] = customer_in.notes.strip()

        if not payload_dict:
            return enrich_customer(customer, db)

        customer.is_verified = False
        log = ActivityLog(
            business_id=current_user.business_id,
            user_id=current_user.id,
            user_name=current_user.name,
            action="UPDATE_CUSTOMER_REQUEST",
            entity_type="customer",
            entity_id=customer.id,
            entity_name=customer.name,
            details=f"Staff member {current_user.name} ({current_user.role}) requested modifications for customer '{customer.name}'. Requires administrator verification.",
            payload=json.dumps(payload_dict),
            status="PENDING_APPROVAL"
        )
        db.add(log)
        db.commit()
        db.refresh(customer)
        return enrich_customer(customer, db)

    # 2. ADMIN and CO-ADMIN ROLES: Update immediately
    is_coadmin = current_user.role == "co_admin"
    changes_desc = []

    if customer_in.name is not None and customer_in.name.strip() != customer.name:
        changes_desc.append(f"Name: '{customer.name}' -> '{customer_in.name.strip()}'")
        customer.name = customer_in.name.strip()
    if customer_in.phone is not None and customer_in.phone.strip() != (customer.phone or ""):
        changes_desc.append("Phone updated")
        customer.phone = customer_in.phone.strip() if customer_in.phone else None
    if customer_in.email is not None and customer_in.email.strip() != (customer.email or ""):
        changes_desc.append("Email updated")
        customer.email = customer_in.email.strip() if customer_in.email else None
    if customer_in.address is not None and customer_in.address.strip() != (customer.address or ""):
        changes_desc.append("Address updated")
        customer.address = customer_in.address.strip() if customer_in.address else None
    if customer_in.notes is not None and customer_in.notes.strip() != (customer.notes or ""):
        changes_desc.append("Notes updated")
        customer.notes = customer_in.notes.strip() if customer_in.notes else None

    customer.is_verified = True

    if is_coadmin:
        # Notify admin of co-manager customer update
        log = ActivityLog(
            business_id=current_user.business_id,
            user_id=current_user.id,
            user_name=current_user.name,
            action="COADMIN_UPDATED_CUSTOMER",
            entity_type="customer",
            entity_id=customer.id,
            entity_name=customer.name,
            details=f"Co-Manager {current_user.name} updated customer '{customer.name}' ({', '.join(changes_desc) if changes_desc else 'profile'}).",
            status="LOGGED"
        )
        db.add(log)
    else:
        # Admin logged
        log = ActivityLog(
            business_id=current_user.business_id,
            user_id=current_user.id,
            user_name=current_user.name,
            action="UPDATE_CUSTOMER",
            entity_type="customer",
            entity_id=customer.id,
            entity_name=customer.name,
            details=f"Admin {current_user.name} updated customer '{customer.name}'.",
            status="LOGGED"
        )
        db.add(log)

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

    # If employee or co_admin, report deletion request to admin
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

        role_label = "Co-Manager" if current_user.role == "co_admin" else "Employee"
        log = ActivityLog(
            business_id=current_user.business_id,
            user_id=current_user.id,
            user_name=current_user.name,
            action="DELETE_REQUEST",
            entity_type="customer",
            entity_id=customer.id,
            entity_name=customer.name,
            details=f"{role_label} {current_user.name} requested permanent deletion of customer '{customer.name}'. Requires administrator approval.",
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
    return {"message": "Customer permanently deleted by administrator.", "status": "DELETED"}
