from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.session import get_db
from app.models.user import User
from app.models.product import Product
from app.models.customer import Customer
from app.models.activity_log import ActivityLog
from app.schemas.admin import EmployeeCreate, EmployeeOut, ActivityLogOut
from app.core.security import get_password_hash
from app.routers.deps import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin & Staff Control"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Administrator role required."
        )
    return current_user


# Staff & Employee Management
@router.get("/employees", response_model=List[EmployeeOut])
def list_employees(
    admin_user: User = Depends(require_admin),
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
    existing = db.query(User).filter(User.email == emp_in.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    new_emp = User(
        name=emp_in.name.strip(),
        email=emp_in.email.lower().strip(),
        password_hash=get_password_hash(emp_in.password),
        role=emp_in.role,
        business_id=admin_user.business_id
    )
    db.add(new_emp)

    # Log action
    log = ActivityLog(
        business_id=admin_user.business_id,
        user_id=admin_user.id,
        user_name=admin_user.name,
        action="HIRE_EMPLOYEE",
        entity_type="user",
        entity_id=None,
        entity_name=new_emp.name,
        details=f"Admin {admin_user.name} hired {new_emp.name} as {new_emp.role}.",
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
    return {"message": f"Employee {emp_name} removed successfully."}


# Activity & Audit Logs
@router.get("/activities", response_model=List[ActivityLogOut])
def list_activities(
    status_filter: Optional[str] = Query(None, description="Filter by status: PENDING_APPROVAL, LOGGED, etc."),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(ActivityLog).filter(ActivityLog.business_id == admin_user.business_id)
    if status_filter:
        query = query.filter(ActivityLog.status == status_filter)

    activities = query.order_by(desc(ActivityLog.created_at)).all()
    return activities


@router.post("/activities/{activity_id}/approve")
def approve_activity(
    activity_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    activity = db.query(ActivityLog).filter(
        ActivityLog.id == activity_id,
        ActivityLog.business_id == admin_user.business_id
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity log not found.")

    if activity.action == "DELETE_REQUEST" and activity.status == "PENDING_APPROVAL":
        # Permanently delete the requested entity
        if activity.entity_type == "product" and activity.entity_id:
            product = db.query(Product).filter(
                Product.id == activity.entity_id,
                Product.business_id == admin_user.business_id
            ).first()
            if product:
                db.delete(product)

        elif activity.entity_type == "customer" and activity.entity_id:
            customer = db.query(Customer).filter(
                Customer.id == activity.entity_id,
                Customer.business_id == admin_user.business_id
            ).first()
            if customer:
                db.delete(customer)

    activity.status = "APPROVED"
    activity.details += f" (Approved & permanently executed by Admin {admin_user.name})"
    db.commit()

    return {"message": "Request approved and permanently executed."}


@router.post("/activities/{activity_id}/dismiss")
def dismiss_activity(
    activity_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    activity = db.query(ActivityLog).filter(
        ActivityLog.id == activity_id,
        ActivityLog.business_id == admin_user.business_id
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity log not found.")

    activity.status = "DISMISSED"
    activity.details += f" (Dismissed by Admin {admin_user.name})"
    db.commit()

    return {"message": "Report dismissed."}
