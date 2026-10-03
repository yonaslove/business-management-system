import json
from datetime import datetime, timezone, time, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_, and_
from app.database.session import get_db
from app.models.user import User
from app.models.product import Product
from app.models.customer import Customer
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.activity_log import ActivityLog
from app.models.business import Business
from app.routers.sales import serialize_sale
from app.schemas.admin import (
    EmployeeCreate,
    EmployeeOut,
    ActivityLogOut,
    DailyReportOut,
    DailyReportSummary,
    StaffDailySales,
    PaymentMethodDaily,
    ItemSoldDaily,
    InventoryStockDaily,
    AdminNotificationSummary
)
from app.core.security import get_password_hash, validate_password_strength
from app.routers.deps import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin & Staff Control"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Administrator role required."
        )
    return current_user


def require_admin_or_co_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("admin", "co_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Administrator or Co-Manager role required."
        )
    return current_user


# Staff & Employee Management
@router.get("/employees", response_model=List[EmployeeOut])
def list_employees(
    admin_user: User = Depends(require_admin_or_co_admin),
    db: Session = Depends(get_db)
):
    employees = db.query(User).filter(
        User.business_id == admin_user.business_id
    ).order_by(User.created_at.asc()).all()
    return employees


@router.post("/employees", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(
    emp_in: EmployeeCreate,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    # Enforce strong password
    try:
        validate_password_strength(emp_in.password)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

    # Check if email exists
    clean_email = emp_in.email.lower().strip()
    existing_email = db.query(User).filter(User.email == clean_email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Determine and check username
    clean_username = emp_in.username.strip().lower() if emp_in.username else clean_email.split("@")[0].lower()
    existing_username = db.query(User).filter(func.lower(User.username) == clean_username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The username '{clean_username}' is already taken. Please choose another username."
        )

    new_emp = User(
        name=emp_in.name.strip(),
        username=clean_username,
        email=clean_email,
        password_hash=get_password_hash(emp_in.password),
        role=emp_in.role,
        business_id=admin_user.business_id
    )
    db.add(new_emp)

    role_label = "Co-Manager" if emp_in.role == "co_admin" else ("Administrator" if emp_in.role == "admin" else ("Delivery Personnel" if emp_in.role == "delivery" else "Employee"))
    log = ActivityLog(
        business_id=admin_user.business_id,
        user_id=admin_user.id,
        user_name=admin_user.name,
        action="HIRE_EMPLOYEE",
        entity_type="user",
        entity_id=None,
        entity_name=new_emp.name,
        details=f"Admin {admin_user.name} added {new_emp.name} (@{clean_username}) as {role_label}.",
        status="LOGGED"
    )
    db.add(log)
    db.commit()
    db.refresh(new_emp)
    return new_emp


@router.delete("/employees/{employee_id}")
def remove_employee(
    employee_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if employee_id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove your own administrator account."
        )

    emp = db.query(User).filter(
        User.id == employee_id,
        User.business_id == admin_user.business_id
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")

    emp_name = emp.name
    db.delete(emp)

    log = ActivityLog(
        business_id=admin_user.business_id,
        user_id=admin_user.id,
        user_name=admin_user.name,
        action="REMOVE_EMPLOYEE",
        entity_type="user",
        entity_id=employee_id,
        entity_name=emp_name,
        details=f"Admin {admin_user.name} removed staff account for {emp_name}.",
        status="LOGGED"
    )
    db.add(log)
    db.commit()
    return {"message": f"Staff member {emp_name} removed successfully."}


# Notifications Hub
@router.get("/notifications", response_model=AdminNotificationSummary)
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ("admin", "co_admin", "delivery"):
        return {
            "pending_approvals_count": 0,
            "pending_approvals": [],
            "recent_activities": [],
            "coadmin_activities_count": 0,
            "coadmin_activities": [],
            "pending_orders_count": 0,
            "pending_orders": [],
            "delivery_orders_count": 0,
            "delivery_orders": [],
            "total_notifications_count": 0
        }

    # Business currency
    biz = db.query(Business).filter(Business.id == current_user.business_id).first()
    curr_sym = biz.currency_symbol if biz and biz.currency_symbol else "Br"

    # 1. Staff approvals pending admin/coadmin review
    pending_logs = db.query(ActivityLog).filter(
        ActivityLog.business_id == current_user.business_id,
        ActivityLog.status == "PENDING_APPROVAL"
    ).order_by(desc(ActivityLog.created_at)).all()

    # 2. Recent activities audit log
    recent_logs = db.query(ActivityLog).filter(
        ActivityLog.business_id == current_user.business_id
    ).order_by(desc(ActivityLog.created_at)).limit(30).all()

    # 3. Specifically filter Co-Manager activities & notifications for the Admin
    coadmin_logs = db.query(ActivityLog).join(User, ActivityLog.user_id == User.id).filter(
        ActivityLog.business_id == current_user.business_id,
        or_(
            ActivityLog.action.like("COADMIN_%"),
            User.role == "co_admin"
        ),
        ActivityLog.status != "CLEARED"
    ).order_by(desc(ActivityLog.created_at)).limit(30).all()

    # 4. Online Orders Pending Verification
    order_logs = db.query(ActivityLog).filter(
        ActivityLog.business_id == current_user.business_id,
        ActivityLog.action.in_(["ONLINE_ORDER_PLACED", "CUSTOMER_DELIVERY_ACKNOWLEDGED"]),
        ActivityLog.status != "CLEARED"
    ).order_by(desc(ActivityLog.created_at)).limit(30).all()

    # Query active sales to ensure any pending online order is captured
    online_sales = db.query(Sale).filter(
        Sale.business_id == current_user.business_id,
        (Sale.user_id == None) | (Sale.notes.like("%Online Order%"))
    ).order_by(desc(Sale.created_at)).limit(50).all()

    existing_order_sale_ids = {l.entity_id for l in order_logs if l.entity_id and l.action == "ONLINE_ORDER_PLACED"}

    for s in online_sales:
        ser = serialize_sale(s)
        if ser["order_status"] in ["PENDING_VERIFICATION", "PENDING"]:
            if s.id not in existing_order_sale_ids:
                has_rec = "with bank receipt attached" if (s.payment_receipt or s.payment_ref) else "cash on delivery"
                cust_name = s.customer.name if s.customer else "Online Customer"
                cust_phone = s.customer.phone if s.customer else "N/A"
                new_log = ActivityLog(
                    business_id=current_user.business_id,
                    user_id=current_user.id,
                    user_name=f"Online Customer: {cust_name}",
                    action="ONLINE_ORDER_PLACED",
                    entity_type="sale",
                    entity_id=s.id,
                    entity_name=f"Order #{s.id}",
                    details=f"Online order #{s.id} from {cust_name} ({cust_phone}) for {curr_sym} {s.total_amount:,.2f} ({has_rec}) is awaiting payment verification.",
                    status="LOGGED"
                )
                db.add(new_log)
                db.commit()
                db.refresh(new_log)
                order_logs.insert(0, new_log)
                existing_order_sale_ids.add(s.id)

    # 5. Delivery Hub Notifications:
    # Orders verified/confirmed ready for courier pickup & delivery, dispatched orders, and customer delivery proof
    delivery_logs = db.query(ActivityLog).filter(
        ActivityLog.business_id == current_user.business_id,
        or_(
            ActivityLog.action.in_(["VERIFY_ONLINE_PAYMENT", "CUSTOMER_DELIVERY_ACKNOWLEDGED", "DELIVERY_ORDER_READY"]),
            and_(ActivityLog.action == "UPDATE_ORDER_STATUS", ActivityLog.details.like("%VERIFIED%")),
            and_(ActivityLog.action == "UPDATE_ORDER_STATUS", ActivityLog.details.like("%CONFIRMED%"))
        ),
        ActivityLog.status != "CLEARED"
    ).order_by(desc(ActivityLog.created_at)).limit(30).all()

    existing_delivery_sale_ids = {l.entity_id for l in delivery_logs if l.entity_id and l.action in ["DELIVERY_ORDER_READY", "VERIFY_ONLINE_PAYMENT"]}

    for s in online_sales:
        ser = serialize_sale(s)
        if ser["order_status"] in ["VERIFIED", "CONFIRMED"]:
            if s.id not in existing_delivery_sale_ids:
                cust_name = s.customer.name if s.customer else "Customer"
                dest_addr = s.customer.address or (s.delivery_notes or "Customer Address")
                new_d_log = ActivityLog(
                    business_id=current_user.business_id,
                    user_id=current_user.id,
                    user_name="Delivery Dispatch",
                    action="DELIVERY_ORDER_READY",
                    entity_type="sale",
                    entity_id=s.id,
                    entity_name=f"Order #{s.id}",
                    details=f"Order #{s.id} for {cust_name} ({curr_sym} {s.total_amount:,.2f}) has been verified and is ready for pickup & delivery to {dest_addr}.",
                    status="LOGGED"
                )
                db.add(new_d_log)
                db.commit()
                db.refresh(new_d_log)
                delivery_logs.insert(0, new_d_log)
                existing_delivery_sale_ids.add(s.id)

    # Calculate total notifications count according to role
    if current_user.role == "delivery":
        total_count = len([l for l in delivery_logs if l.status in ["LOGGED", "SEEN"]])
    elif current_user.role == "co_admin":
        total_count = (
            len(pending_logs) + 
            len([l for l in order_logs if l.status == "LOGGED"]) + 
            len([l for l in delivery_logs if l.action == "CUSTOMER_DELIVERY_ACKNOWLEDGED" and l.status == "LOGGED"])
        )
    else:
        # admin
        total_count = (
            len(pending_logs) + 
            len([l for l in coadmin_logs if l.status == "LOGGED"]) + 
            len([l for l in order_logs if l.status == "LOGGED"]) + 
            len([l for l in delivery_logs if l.action == "CUSTOMER_DELIVERY_ACKNOWLEDGED" and l.status == "LOGGED"])
        )

    return {
        "pending_approvals_count": len(pending_logs),
        "pending_approvals": pending_logs,
        "recent_activities": recent_logs,
        "coadmin_activities_count": len(coadmin_logs),
        "coadmin_activities": coadmin_logs,
        "pending_orders_count": len(order_logs),
        "pending_orders": order_logs,
        "delivery_orders_count": len(delivery_logs),
        "delivery_orders": delivery_logs,
        "total_notifications_count": total_count
    }


@router.post("/notifications/mark-seen")
def mark_notifications_seen(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all currently LOGGED notifications as SEEN so badge count resets."""
    if current_user.role not in ("admin", "co_admin", "delivery"):
        return {"message": "No-op"}

    db.query(ActivityLog).filter(
        ActivityLog.business_id == current_user.business_id,
        ActivityLog.status == "LOGGED"
    ).update({"status": "SEEN"}, synchronize_session=False)
    db.commit()
    return {"message": "Notifications marked as seen."}


@router.post("/notifications/clear")
def clear_notifications_tray(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear seen notifications from the header tray."""
    if current_user.role not in ("admin", "co_admin", "delivery"):
        return {"message": "No-op"}

    db.query(ActivityLog).filter(
        ActivityLog.business_id == current_user.business_id,
        ActivityLog.status.in_(["LOGGED", "SEEN"])
    ).update({"status": "CLEARED"}, synchronize_session=False)
    db.commit()
    return {"message": "Notification tray cleared."}




# Activity & Audit Logs
@router.get("/activities", response_model=List[ActivityLogOut])
def list_activities(
    status_filter: Optional[str] = Query(None, description="Filter by status: PENDING_APPROVAL, LOGGED, COADMIN, etc."),
    admin_user: User = Depends(require_admin_or_co_admin),
    db: Session = Depends(get_db)
):
    query = db.query(ActivityLog).filter(ActivityLog.business_id == admin_user.business_id)
    if status_filter == "COADMIN":
        query = query.join(User, ActivityLog.user_id == User.id).filter(
            or_(
                ActivityLog.action.like("COADMIN_%"),
                User.role == "co_admin"
            )
        )
    elif status_filter:
        query = query.filter(ActivityLog.status == status_filter)

    activities = query.order_by(desc(ActivityLog.created_at)).all()
    return activities


@router.post("/activities/{activity_id}/approve")
def approve_activity(
    activity_id: int,
    current_user: User = Depends(require_admin_or_co_admin),
    db: Session = Depends(get_db)
):
    activity = db.query(ActivityLog).filter(
        ActivityLog.id == activity_id,
        ActivityLog.business_id == current_user.business_id
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity log not found.")

    if activity.status != "PENDING_APPROVAL":
        raise HTTPException(status_code=400, detail="This activity request is not pending approval.")

    # CO-ADMIN PERMISSION CHECKS:
    # Co-admin can approve employee activities (products, customers, employee profile, deletions),
    # but activities initiated by a co-admin must be reported to and approved by the Admin.
    if current_user.role == "co_admin":
        if activity.user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Co-Managers cannot self-approve their own activity requests. Your activity is reported to and must be approved by the Business Administrator."
            )

        initiator = db.query(User).filter(User.id == activity.user_id).first()
        if initiator and initiator.role in ("admin", "co_admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Co-Managers cannot approve requests from other managers ({initiator.role}). Only the Business Administrator can authorize them."
            )

        if activity.action == "UPDATE_SETTINGS_REQUEST":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the Business Administrator has authority to approve store settings and currency modifications."
            )

    approver_title = "Admin" if current_user.role == "admin" else "Co-Manager"

    # 1. Permanent Deletion Approval
    if activity.action == "DELETE_REQUEST":
        if activity.entity_type == "product" and activity.entity_id:
            product = db.query(Product).filter(
                Product.id == activity.entity_id,
                Product.business_id == current_user.business_id
            ).first()
            if product:
                db.delete(product)

        elif activity.entity_type == "customer" and activity.entity_id:
            customer = db.query(Customer).filter(
                Customer.id == activity.entity_id,
                Customer.business_id == current_user.business_id
            ).first()
            if customer:
                db.delete(customer)

        activity.status = "APPROVED"
        activity.details += f" (Approved & permanently deleted by {approver_title} {current_user.name})"
        
        # Report Co-Manager approval action to Admin audit log
        if current_user.role == "co_admin":
            db.add(ActivityLog(
                business_id=current_user.business_id,
                user_id=current_user.id,
                user_name=current_user.name,
                action="COADMIN_APPROVED_DELETE",
                entity_type=activity.entity_type,
                entity_id=activity.entity_id,
                entity_name=activity.entity_name,
                details=f"Co-Manager {current_user.name} approved deletion request for employee {activity.user_name}.",
                status="LOGGED"
            ))

        db.commit()
        return {"message": "Deletion request approved and permanently executed."}

    # 2. Product Creation Approval (Verified)
    elif activity.action == "CREATE_PRODUCT_REQUEST":
        if activity.entity_type == "product" and activity.entity_id:
            product = db.query(Product).filter(
                Product.id == activity.entity_id,
                Product.business_id == current_user.business_id
            ).first()
            if product:
                product.is_verified = True

        activity.status = "APPROVED"
        activity.details += f" (Verified & approved for sale by {approver_title} {current_user.name})"
        
        if current_user.role == "co_admin":
            db.add(ActivityLog(
                business_id=current_user.business_id,
                user_id=current_user.id,
                user_name=current_user.name,
                action="COADMIN_APPROVED_PRODUCT",
                entity_type="product",
                entity_id=activity.entity_id,
                entity_name=activity.entity_name,
                details=f"Co-Manager {current_user.name} approved product creation '{activity.entity_name}' for employee {activity.user_name}.",
                status="LOGGED"
            ))

        db.commit()
        return {"message": "Product creation verified and approved for retail sales."}

    # 3. Product Update Approval (Apply changes & Verified)
    elif activity.action in ("UPDATE_PRODUCT_REQUEST", "PRICE_STOCK_REQUEST", "PRICE_CHANGE_REQUEST", "STOCK_CHANGE_REQUEST"):
        applied_notes = []
        if activity.entity_type == "product" and activity.entity_id:
            product = db.query(Product).filter(
                Product.id == activity.entity_id,
                Product.business_id == current_user.business_id
            ).first()
            if not product:
                raise HTTPException(status_code=404, detail="Target product no longer exists.")

            if activity.payload:
                try:
                    changes = json.loads(activity.payload)
                    if "name" in changes and changes["name"]:
                        product.name = changes["name"].strip()
                        applied_notes.append(f"Name -> '{product.name}'")
                    if "price" in changes and changes["price"] is not None:
                        old_p = product.price
                        product.price = float(changes["price"])
                        applied_notes.append(f"Price: {old_p:.2f} -> {product.price:.2f}")
                    if "stock_quantity" in changes and changes["stock_quantity"] is not None:
                        old_s = product.stock_quantity
                        product.stock_quantity = int(changes["stock_quantity"])
                        applied_notes.append(f"Stock: {old_s} -> {product.stock_quantity}")
                    if "low_stock_threshold" in changes and changes["low_stock_threshold"] is not None:
                        product.low_stock_threshold = int(changes["low_stock_threshold"])
                    if "category_id" in changes and changes["category_id"] is not None:
                        product.category_id = int(changes["category_id"])
                    if "sku" in changes and changes["sku"] is not None:
                        product.sku = changes["sku"].strip()
                    if "description" in changes and changes["description"] is not None:
                        product.description = changes["description"].strip()
                except Exception:
                    pass

            product.is_verified = True

        activity.status = "APPROVED"
        applied_str = f" [{', '.join(applied_notes)}]" if applied_notes else ""
        activity.details += f" (Approved & applied to catalog by {approver_title} {current_user.name}{applied_str})"

        if current_user.role == "co_admin":
            db.add(ActivityLog(
                business_id=current_user.business_id,
                user_id=current_user.id,
                user_name=current_user.name,
                action="COADMIN_APPROVED_PRODUCT_UPDATE",
                entity_type="product",
                entity_id=activity.entity_id,
                entity_name=activity.entity_name,
                details=f"Co-Manager {current_user.name} approved product update for employee {activity.user_name} on '{activity.entity_name}'.",
                status="LOGGED"
            ))

        db.commit()
        return {"message": "Product modifications approved and applied to catalog."}

    # 4. Customer Creation Approval (Verified)
    elif activity.action == "CREATE_CUSTOMER_REQUEST":
        if activity.entity_type == "customer" and activity.entity_id:
            customer = db.query(Customer).filter(
                Customer.id == activity.entity_id,
                Customer.business_id == current_user.business_id
            ).first()
            if customer:
                customer.is_verified = True

        activity.status = "APPROVED"
        activity.details += f" (Verified & approved by {approver_title} {current_user.name})"

        if current_user.role == "co_admin":
            db.add(ActivityLog(
                business_id=current_user.business_id,
                user_id=current_user.id,
                user_name=current_user.name,
                action="COADMIN_APPROVED_CUSTOMER",
                entity_type="customer",
                entity_id=activity.entity_id,
                entity_name=activity.entity_name,
                details=f"Co-Manager {current_user.name} approved customer creation '{activity.entity_name}' for employee {activity.user_name}.",
                status="LOGGED"
            ))

        db.commit()
        return {"message": "Customer account verified and approved."}

    # 5. Customer Update Approval (Apply changes & Verified)
    elif activity.action == "UPDATE_CUSTOMER_REQUEST":
        if activity.entity_type == "customer" and activity.entity_id:
            customer = db.query(Customer).filter(
                Customer.id == activity.entity_id,
                Customer.business_id == current_user.business_id
            ).first()
            if customer and activity.payload:
                try:
                    changes = json.loads(activity.payload)
                    if "name" in changes and changes["name"]:
                        customer.name = changes["name"].strip()
                    if "phone" in changes:
                        customer.phone = changes["phone"].strip() if changes["phone"] else None
                    if "email" in changes:
                        customer.email = changes["email"].strip() if changes["email"] else None
                    if "address" in changes:
                        customer.address = changes["address"].strip() if changes["address"] else None
                    if "notes" in changes:
                        customer.notes = changes["notes"].strip() if changes["notes"] else None
                except Exception:
                    pass
                customer.is_verified = True

        activity.status = "APPROVED"
        activity.details += f" (Customer modifications approved by {approver_title} {current_user.name})"

        if current_user.role == "co_admin":
            db.add(ActivityLog(
                business_id=current_user.business_id,
                user_id=current_user.id,
                user_name=current_user.name,
                action="COADMIN_APPROVED_CUSTOMER_UPDATE",
                entity_type="customer",
                entity_id=activity.entity_id,
                entity_name=activity.entity_name,
                details=f"Co-Manager {current_user.name} approved customer update on '{activity.entity_name}' for employee {activity.user_name}.",
                status="LOGGED"
            ))

        db.commit()
        return {"message": "Customer changes approved and verified successfully."}

    # 6. Business Settings Update Approval
    elif activity.action == "UPDATE_SETTINGS_REQUEST":
        biz = db.query(Business).filter(Business.id == current_user.business_id).first()
        if biz and activity.payload:
            try:
                changes = json.loads(activity.payload)
                if "name" in changes and changes["name"]:
                    biz.name = changes["name"].strip()
                if "email" in changes:
                    biz.email = changes["email"].strip() if changes["email"] else None
                if "phone" in changes:
                    biz.phone = changes["phone"].strip() if changes["phone"] else None
                if "address" in changes:
                    biz.address = changes["address"].strip() if changes["address"] else None
                if "currency" in changes and changes["currency"]:
                    biz.currency = changes["currency"].strip()
                if "currency_symbol" in changes and changes["currency_symbol"]:
                    biz.currency_symbol = changes["currency_symbol"].strip()
            except Exception:
                pass

        activity.status = "APPROVED"
        activity.details += f" (Store settings approved by Admin {current_user.name})"
        db.commit()
        return {"message": "Business settings changes approved and applied successfully."}

    # 7. User Profile Update Approval
    elif activity.action == "UPDATE_PROFILE_REQUEST":
        if activity.entity_type == "user" and activity.entity_id:
            target_user = db.query(User).filter(
                User.id == activity.entity_id,
                User.business_id == current_user.business_id
            ).first()
            if target_user and activity.payload:
                try:
                    changes = json.loads(activity.payload)
                    if "name" in changes and changes["name"]:
                        target_user.name = changes["name"].strip()
                    if "email" in changes and changes["email"]:
                        target_user.email = changes["email"].strip().lower()
                    if "username" in changes and changes["username"]:
                        target_user.username = changes["username"].strip().lower()
                    if "password" in changes and changes["password"]:
                        target_user.password_hash = get_password_hash(changes["password"])
                except Exception:
                    pass

        activity.status = "APPROVED"
        activity.details += f" (Staff profile update approved by {approver_title} {current_user.name})"
        db.commit()
        return {"message": "Staff profile changes approved and updated."}

    activity.status = "APPROVED"
    activity.details += f" (Approved by {approver_title} {current_user.name})"
    db.commit()
    return {"message": "Request approved."}


@router.post("/activities/{activity_id}/dismiss")
def dismiss_activity(
    activity_id: int,
    current_user: User = Depends(require_admin_or_co_admin),
    db: Session = Depends(get_db)
):
    activity = db.query(ActivityLog).filter(
        ActivityLog.id == activity_id,
        ActivityLog.business_id == current_user.business_id
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity log not found.")

    if current_user.role == "co_admin":
        if activity.user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Co-Managers cannot dismiss their own activity requests. These are reported to the Business Administrator."
            )
        initiator = db.query(User).filter(User.id == activity.user_id).first()
        if initiator and initiator.role in ("admin", "co_admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Co-Managers can only dismiss employee requests."
            )

    approver_title = "Admin" if current_user.role == "admin" else "Co-Manager"
    activity.status = "DISMISSED"
    activity.details += f" (Dismissed by {approver_title} {current_user.name})"

    if current_user.role == "co_admin":
        db.add(ActivityLog(
            business_id=current_user.business_id,
            user_id=current_user.id,
            user_name=current_user.name,
            action="COADMIN_DISMISSED_ACTIVITY",
            entity_type=activity.entity_type,
            entity_id=activity.entity_id,
            entity_name=activity.entity_name,
            details=f"Co-Manager {current_user.name} dismissed {activity.action} request for employee {activity.user_name}.",
            status="LOGGED"
        ))

    db.commit()

    return {"message": f"Report dismissed by {approver_title} {current_user.name}."}


@router.delete("/activities/{activity_id}")
def delete_activity_log(
    activity_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    activity = db.query(ActivityLog).filter(
        ActivityLog.id == activity_id,
        ActivityLog.business_id == admin_user.business_id
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity report not found.")

    db.delete(activity)
    db.commit()
    return {"message": "Activity report deleted successfully.", "id": activity_id}


# Daily Report
@router.get("/daily-report", response_model=DailyReportOut)
def get_daily_report(
    date_str: Optional[str] = Query(None, alias="date", description="Target date in YYYY-MM-DD format"),
    admin_user: User = Depends(require_admin_or_co_admin),
    db: Session = Depends(get_db)
):
    bid = admin_user.business_id
    biz = db.query(Business).filter(Business.id == bid).first()
    currency = biz.currency if biz else "ETB"
    currency_symbol = biz.currency_symbol if biz else "Br"

    # Parse date
    if date_str:
        try:
            target_date = datetime.strptime(date_str.strip(), "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")
    else:
        target_date = datetime.now(timezone.utc).date()

    start_dt = datetime.combine(target_date, time.min).replace(tzinfo=timezone.utc)
    end_dt = datetime.combine(target_date, time.max).replace(tzinfo=timezone.utc)

    # Fetch all sales on this date for this business
    sales = db.query(Sale).filter(
        Sale.business_id == bid,
        Sale.created_at >= start_dt,
        Sale.created_at <= end_dt
    ).order_by(desc(Sale.created_at)).all()

    total_revenue = sum(s.total_amount for s in sales)
    total_sales_count = len(sales)
    total_units_sold = sum(item.quantity for s in sales for item in s.items)

    # Fetch all products for inventory status
    products = db.query(Product).filter(Product.business_id == bid).order_by(Product.name.asc()).all()
    total_inventory_items = len(products)
    total_remaining_stock = sum(p.stock_quantity for p in products)
    empty_products_count = sum(1 for p in products if p.stock_quantity <= 0)
    low_stock_products_count = sum(1 for p in products if 0 < p.stock_quantity <= p.low_stock_threshold)

    # 1. Staff sales breakdown
    staff_map = {}
    for s in sales:
        u_id = s.user_id
        if u_id not in staff_map:
            user_obj = db.query(User).filter(User.id == u_id).first() if u_id else None
            staff_name = user_obj.name if user_obj else "Unknown Staff"
            staff_role = user_obj.role if user_obj else "employee"
            staff_map[u_id] = {
                "user_id": u_id,
                "user_name": staff_name,
                "role": staff_role,
                "sales_count": 0,
                "units_sold": 0,
                "total_revenue": 0.0
            }
        staff_map[u_id]["sales_count"] += 1
        staff_map[u_id]["total_revenue"] += s.total_amount
        staff_map[u_id]["units_sold"] += sum(i.quantity for i in s.items)

    staff_sales = [StaffDailySales(**item) for item in staff_map.values()]
    staff_sales.sort(key=lambda x: x.total_revenue, reverse=True)

    # 2. Payment methods breakdown
    pm_map = {}
    for s in sales:
        pm = s.payment_method or "Cash"
        if pm not in pm_map:
            pm_map[pm] = {"amount": 0.0, "count": 0}
        pm_map[pm]["amount"] += s.total_amount
        pm_map[pm]["count"] += 1

    payment_methods = []
    for pm, data in pm_map.items():
        pct = round((data["amount"] / total_revenue * 100), 1) if total_revenue > 0 else 0.0
        payment_methods.append(PaymentMethodDaily(
            method=pm,
            amount=round(data["amount"], 2),
            count=data["count"],
            percentage=pct
        ))
    payment_methods.sort(key=lambda x: x.amount, reverse=True)

    # 3. Items sold breakdown
    items_sold_map = {}
    for s in sales:
        for item in s.items:
            pid = item.product_id
            if pid not in items_sold_map:
                prod = db.query(Product).filter(Product.id == pid).first()
                cat_name = prod.category.name if (prod and prod.category) else None
                items_sold_map[pid] = {
                    "product_id": pid,
                    "product_name": item.product_name,
                    "category_name": cat_name,
                    "quantity_sold": 0,
                    "unit_price": item.unit_price,
                    "total_revenue": 0.0
                }
            items_sold_map[pid]["quantity_sold"] += item.quantity
            items_sold_map[pid]["total_revenue"] += item.subtotal

    items_sold = [ItemSoldDaily(**v) for v in items_sold_map.values()]
    items_sold.sort(key=lambda x: x.total_revenue, reverse=True)

    # 4. Inventory status sheet
    inventory_status = []
    for p in products:
        if p.stock_quantity <= 0:
            st = "EMPTY"
        elif p.stock_quantity <= p.low_stock_threshold:
            st = "LOW STOCK"
        else:
            st = "IN STOCK"

        inventory_status.append(InventoryStockDaily(
            product_id=p.id,
            product_name=p.name,
            category_name=p.category.name if p.category else "Uncategorized",
            price=p.price,
            remaining_stock=p.stock_quantity,
            low_stock_threshold=p.low_stock_threshold,
            status=st,
            is_verified=bool(p.is_verified)
        ))

    summary = DailyReportSummary(
        date=target_date.strftime("%Y-%m-%d"),
        total_revenue=round(total_revenue, 2),
        total_sales_count=total_sales_count,
        total_units_sold=total_units_sold,
        total_inventory_items=total_inventory_items,
        total_remaining_stock=total_remaining_stock,
        empty_products_count=empty_products_count,
        low_stock_products_count=low_stock_products_count,
        currency=currency,
        currency_symbol=currency_symbol
    )

    return DailyReportOut(
        summary=summary,
        staff_sales=staff_sales,
        payment_methods=payment_methods,
        items_sold=items_sold,
        inventory_status=inventory_status
    )
