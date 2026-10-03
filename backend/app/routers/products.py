import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database.session import get_db
from app.models.user import User
from app.models.product import Product
from app.models.category import Category
from app.models.activity_log import ActivityLog
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductOut,
    ProductUpdateOut,
    CategoryCreate,
    CategoryOut
)
from app.routers.deps import get_current_user

router = APIRouter(tags=["Products & Categories"])


def calculate_stock_status(stock: int, threshold: int) -> str:
    if stock <= 0:
        return "EMPTY"
    elif stock <= threshold:
        return "LOW STOCK"
    return "IN STOCK"


def serialize_product(p: Product) -> dict:
    return {
        "id": p.id,
        "business_id": p.business_id,
        "category_id": p.category_id,
        "category_name": p.category.name if p.category else None,
        "name": p.name,
        "description": p.description,
        "price": p.price,
        "stock_quantity": p.stock_quantity,
        "low_stock_threshold": p.low_stock_threshold,
        "sku": p.sku,
        "is_verified": bool(p.is_verified),
        "stock_status": calculate_stock_status(p.stock_quantity, p.low_stock_threshold),
        "created_at": p.created_at,
        "updated_at": p.updated_at
    }


# Categories
@router.get("/categories", response_model=List[CategoryOut])
def get_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    categories = db.query(Category).filter(Category.business_id == current_user.business_id).all()
    return categories


@router.post("/categories", response_model=CategoryOut)
def create_category(
    cat_in: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    category = Category(
        name=cat_in.name.strip(),
        business_id=current_user.business_id
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


# Products
@router.get("/products", response_model=List[ProductOut])
def list_products(
    search: Optional[str] = Query(None, description="Search by product name or SKU"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    stock_status: Optional[str] = Query(None, description="Filter by stock status: in_stock, low_stock, empty"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.business_id == current_user.business_id)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(Product.name.ilike(s), Product.sku.ilike(s), Product.description.ilike(s)))

    if category_id:
        query = query.filter(Product.category_id == category_id)

    products = query.order_by(Product.name.asc()).all()

    result = []
    for p in products:
        item = serialize_product(p)
        if stock_status:
            normalized_filter = stock_status.upper().replace("_", " ")
            if normalized_filter == "OUT OF STOCK":
                normalized_filter = "EMPTY"
            if item["stock_status"] != normalized_filter:
                continue
        result.append(item)

    return result


@router.get("/products/{product_id}", response_model=ProductOut)
def get_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.business_id == current_user.business_id
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize_product(product)


@router.post("/products", response_model=ProductOut)
def create_product(
    product_in: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if product_in.price < 0:
        raise HTTPException(status_code=400, detail="Price cannot be negative")
    if product_in.stock_quantity < 0:
        raise HTTPException(status_code=400, detail="Stock quantity cannot be negative")

    # If created by employee, product must be approved before verified (is_verified = False)
    # If created by co_admin or admin, product is verified immediately (is_verified = True)
    is_admin = current_user.role == "admin"
    is_coadmin = current_user.role == "co_admin"
    is_verified = is_admin or is_coadmin

    product = Product(
        business_id=current_user.business_id,
        category_id=product_in.category_id,
        name=product_in.name.strip(),
        description=product_in.description.strip() if product_in.description else None,
        price=product_in.price,
        stock_quantity=product_in.stock_quantity,
        low_stock_threshold=product_in.low_stock_threshold,
        sku=product_in.sku.strip() if product_in.sku else None,
        is_verified=is_verified
    )
    db.add(product)
    db.flush()

    if is_coadmin:
        # Co-Manager adds product directly, notifying admin
        log = ActivityLog(
            business_id=current_user.business_id,
            user_id=current_user.id,
            user_name=current_user.name,
            action="COADMIN_ADDED_PRODUCT",
            entity_type="product",
            entity_id=product.id,
            entity_name=product.name,
            details=(
                f"Co-Manager {current_user.name} added product '{product.name}' "
                f"(Price: {product.price:.2f} ETB, Stock: {product.stock_quantity}). Verified and ready for sale."
            ),
            payload=json.dumps({
                "product_id": product.id,
                "name": product.name,
                "price": product.price,
                "stock_quantity": product.stock_quantity,
                "category_id": product.category_id,
                "sku": product.sku
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
            action="CREATE_PRODUCT_REQUEST",
            entity_type="product",
            entity_id=product.id,
            entity_name=product.name,
            details=(
                f"Staff member {current_user.name} ({current_user.role}) added product '{product.name}' "
                f"(Price: {product.price:.2f}, Stock: {product.stock_quantity}). Requires administrator verification before being sold."
            ),
            payload=json.dumps({
                "product_id": product.id,
                "name": product.name,
                "price": product.price,
                "stock_quantity": product.stock_quantity,
                "category_id": product.category_id,
                "sku": product.sku
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
            action="CREATE_PRODUCT",
            entity_type="product",
            entity_id=product.id,
            entity_name=product.name,
            details=f"Admin {current_user.name} added product '{product.name}' (Price: {product.price:.2f} ETB, Stock: {product.stock_quantity}).",
            payload=json.dumps({
                "product_id": product.id,
                "name": product.name,
                "price": product.price,
                "stock_quantity": product.stock_quantity,
                "category_id": product.category_id,
                "sku": product.sku
            }),
            status="LOGGED"
        )
        db.add(log)

    db.commit()
    db.refresh(product)
    return serialize_product(product)


@router.put("/products/{product_id}", response_model=ProductUpdateOut)
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.business_id == current_user.business_id
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    has_price_change = product_in.price is not None and product_in.price != product.price
    has_stock_change = product_in.stock_quantity is not None and product_in.stock_quantity != product.stock_quantity

    # 1. EMPLOYEE ROLE: Cannot change directly; submits request for admin/co-admin verification
    if current_user.role == "employee":
        payload_dict = {}
        requested_items = []

        if product_in.name is not None and product_in.name.strip() != product.name:
            payload_dict["name"] = product_in.name.strip()
            requested_items.append(f"Name: '{product.name}' -> '{product_in.name.strip()}'")

        if product_in.price is not None and product_in.price != product.price:
            if product_in.price < 0:
                raise HTTPException(status_code=400, detail="Price cannot be negative")
            payload_dict["price"] = product_in.price
            requested_items.append(f"Price: {product.price:.2f} -> {product_in.price:.2f}")

        if product_in.stock_quantity is not None and product_in.stock_quantity != product.stock_quantity:
            if product_in.stock_quantity < 0:
                raise HTTPException(status_code=400, detail="Stock quantity cannot be negative")
            payload_dict["stock_quantity"] = product_in.stock_quantity
            requested_items.append(f"Stock: {product.stock_quantity} -> {product_in.stock_quantity}")

        if product_in.low_stock_threshold is not None and product_in.low_stock_threshold != product.low_stock_threshold:
            payload_dict["low_stock_threshold"] = product_in.low_stock_threshold
            requested_items.append(f"Threshold: {product.low_stock_threshold} -> {product_in.low_stock_threshold}")

        if product_in.category_id is not None and product_in.category_id != product.category_id:
            payload_dict["category_id"] = product_in.category_id
            requested_items.append(f"Category ID: {product.category_id} -> {product_in.category_id}")

        if product_in.sku is not None and product_in.sku.strip() != (product.sku or ""):
            payload_dict["sku"] = product_in.sku.strip()
            requested_items.append(f"SKU: {product.sku} -> {product_in.sku.strip()}")

        if product_in.description is not None and product_in.description.strip() != (product.description or ""):
            payload_dict["description"] = product_in.description.strip()
            requested_items.append("Description updated")

        if not payload_dict:
            res = serialize_product(product)
            res["status"] = "UPDATED"
            res["message"] = "No changes detected."
            return res

        product.is_verified = False  # Mark unverified pending approval
        details_str = (
            f"Staff member {current_user.name} ({current_user.role}) requested modifications for '{product.name}': "
            f"{', '.join(requested_items)}. Requires administrator approval before verification."
        )
        log = ActivityLog(
            business_id=current_user.business_id,
            user_id=current_user.id,
            user_name=current_user.name,
            action="UPDATE_PRODUCT_REQUEST",
            entity_type="product",
            entity_id=product.id,
            entity_name=product.name,
            details=details_str,
            payload=json.dumps(payload_dict),
            status="PENDING_APPROVAL"
        )
        db.add(log)
        db.commit()
        db.refresh(product)

        res = serialize_product(product)
        res["status"] = "PENDING_APPROVAL"
        res["message"] = (
            f"Product modifications ({', '.join(requested_items)}) submitted for administrator verification. "
            "Changes will take effect once approved by the administrator."
        )
        return res

    # 2. ADMIN and CO-ADMIN ROLES: Can change price, stock, and attributes directly
    # Co-Admin updates are immediately active, but notified to Admin via ActivityLog
    is_coadmin = current_user.role == "co_admin"

    if has_price_change:
        if product_in.price < 0:
            raise HTTPException(status_code=400, detail="Price cannot be negative")
        old_price = product.price
        new_price = product_in.price
        product.price = new_price

        action_name = "COADMIN_PRICE_CHANGE" if is_coadmin else "PRICE_CHANGE"
        role_label = "Co-Manager" if is_coadmin else "Admin"
        log = ActivityLog(
            business_id=current_user.business_id,
            user_id=current_user.id,
            user_name=current_user.name,
            action=action_name,
            entity_type="product",
            entity_id=product.id,
            entity_name=product.name,
            details=f"{role_label} {current_user.name} changed price of '{product.name}' from {old_price:.2f} ETB to {new_price:.2f} ETB.",
            payload=json.dumps({"old_price": old_price, "new_price": new_price}),
            status="LOGGED"
        )
        db.add(log)

    if has_stock_change:
        if product_in.stock_quantity < 0:
            raise HTTPException(status_code=400, detail="Stock quantity cannot be negative")
        old_stock = product.stock_quantity
        new_stock = product_in.stock_quantity
        product.stock_quantity = new_stock

        action_name = "COADMIN_STOCK_UPDATE" if is_coadmin else "STOCK_UPDATE"
        role_label = "Co-Manager" if is_coadmin else "Admin"
        log = ActivityLog(
            business_id=current_user.business_id,
            user_id=current_user.id,
            user_name=current_user.name,
            action=action_name,
            entity_type="product",
            entity_id=product.id,
            entity_name=product.name,
            details=f"{role_label} {current_user.name} adjusted stock of '{product.name}' from {old_stock} to {new_stock} units.",
            payload=json.dumps({"old_stock": old_stock, "new_stock": new_stock}),
            status="LOGGED"
        )
        db.add(log)

    other_changes = []
    if product_in.name is not None and product_in.name.strip() != product.name:
        other_changes.append(f"Name: '{product.name}' -> '{product_in.name.strip()}'")
        product.name = product_in.name.strip()
    if product_in.description is not None:
        product.description = product_in.description.strip() if product_in.description else None
    if product_in.low_stock_threshold is not None and product_in.low_stock_threshold != product.low_stock_threshold:
        other_changes.append(f"Low Stock Threshold: {product.low_stock_threshold} -> {product_in.low_stock_threshold}")
        product.low_stock_threshold = product_in.low_stock_threshold
    if product_in.category_id is not None and product_in.category_id != product.category_id:
        other_changes.append(f"Category ID: {product.category_id} -> {product_in.category_id}")
        product.category_id = product_in.category_id
    if product_in.sku is not None and product_in.sku.strip() != (product.sku or ""):
        other_changes.append(f"SKU: {product.sku} -> {product_in.sku.strip()}")
        product.sku = product_in.sku.strip() if product_in.sku else None

    # If co_admin modified details without price/stock change, notify admin
    if is_coadmin and other_changes and not has_price_change and not has_stock_change:
        log = ActivityLog(
            business_id=current_user.business_id,
            user_id=current_user.id,
            user_name=current_user.name,
            action="COADMIN_UPDATED_PRODUCT",
            entity_type="product",
            entity_id=product.id,
            entity_name=product.name,
            details=f"Co-Manager {current_user.name} updated product '{product.name}': {', '.join(other_changes)}.",
            status="LOGGED"
        )
        db.add(log)

    product.is_verified = True
    db.commit()
    db.refresh(product)
    res = serialize_product(product)
    res["status"] = "UPDATED"
    res["message"] = "Product updated successfully."
    return res


@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.business_id == current_user.business_id
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # If employee or co_admin, forbid permanent delete and submit deletion request to admin
    if current_user.role != "admin":
        existing_req = db.query(ActivityLog).filter(
            ActivityLog.business_id == current_user.business_id,
            ActivityLog.entity_type == "product",
            ActivityLog.entity_id == product.id,
            ActivityLog.action == "DELETE_REQUEST",
            ActivityLog.status == "PENDING_APPROVAL"
        ).first()

        if existing_req:
            return {
                "message": "Deletion request for this product is already pending administrator approval.",
                "status": "PENDING_APPROVAL"
            }

        role_label = "Co-Manager" if current_user.role == "co_admin" else "Employee"
        log = ActivityLog(
            business_id=current_user.business_id,
            user_id=current_user.id,
            user_name=current_user.name,
            action="DELETE_REQUEST",
            entity_type="product",
            entity_id=product.id,
            entity_name=product.name,
            details=f"{role_label} {current_user.name} requested permanent deletion of '{product.name}' (Stock: {product.stock_quantity}, Price: {product.price:.2f} ETB). Requires administrator approval.",
            status="PENDING_APPROVAL"
        )
        db.add(log)
        db.commit()
        return {
            "message": f"Deletion request submitted to business admin for review. Only administrators can permanently delete products.",
            "status": "PENDING_APPROVAL"
        }

    # Admin: permanently delete
    prod_name = product.name
    db.delete(product)

    log = ActivityLog(
        business_id=current_user.business_id,
        user_id=current_user.id,
        user_name=current_user.name,
        action="DELETE_PERMANENT",
        entity_type="product",
        entity_id=product_id,
        entity_name=prod_name,
        details=f"Admin {current_user.name} permanently deleted product '{prod_name}'.",
        status="LOGGED"
    )
    db.add(log)
    db.commit()

    return {"message": "Product permanently deleted by administrator.", "status": "DELETED"}
