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
        return "OUT OF STOCK"
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
    stock_status: Optional[str] = Query(None, description="Filter by stock status: in_stock, low_stock, out_of_stock"),
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
            target = stock_status.upper().replace("_", " ")
            if item["stock_status"] != target:
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

    product = Product(
        business_id=current_user.business_id,
        category_id=product_in.category_id,
        name=product_in.name.strip(),
        description=product_in.description.strip() if product_in.description else None,
        price=product_in.price,
        stock_quantity=product_in.stock_quantity,
        low_stock_threshold=product_in.low_stock_threshold,
        sku=product_in.sku.strip() if product_in.sku else None
    )
    db.add(product)
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

    if current_user.role != "admin":
        # EMPLOYEE ROLE: Cannot directly alter price or stock quantity
        if has_price_change or has_stock_change:
            payload_dict = {}
            requested_items = []

            if has_price_change:
                if product_in.price < 0:
                    raise HTTPException(status_code=400, detail="Price cannot be negative")
                payload_dict["price"] = product_in.price
                requested_items.append(f"Price: {product.price:.2f} -> {product_in.price:.2f} ETB")

            if has_stock_change:
                if product_in.stock_quantity < 0:
                    raise HTTPException(status_code=400, detail="Stock quantity cannot be negative")
                payload_dict["stock_quantity"] = product_in.stock_quantity
                requested_items.append(f"Stock: {product.stock_quantity} -> {product_in.stock_quantity} units")

            # Apply safe non-financial metadata if provided
            if product_in.name is not None:
                product.name = product_in.name.strip()
            if product_in.description is not None:
                product.description = product_in.description.strip() if product_in.description else None
            if product_in.low_stock_threshold is not None:
                product.low_stock_threshold = product_in.low_stock_threshold
            if product_in.category_id is not None:
                product.category_id = product_in.category_id
            if product_in.sku is not None:
                product.sku = product_in.sku.strip() if product_in.sku else None

            # Create approval request for admin
            details_str = (
                f"Employee {current_user.name} requested modifications for '{product.name}': "
                f"{', '.join(requested_items)}. Requires administrator approval."
            )
            log = ActivityLog(
                business_id=current_user.business_id,
                user_id=current_user.id,
                user_name=current_user.name,
                action="PRICE_STOCK_REQUEST",
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
                f"Price and quantity modifications ({', '.join(requested_items)}) "
                "cannot be changed directly by staff. Approval request submitted to store administrator."
            )
            return res

        # Employee updated non-financial metadata only
        if product_in.name is not None:
            product.name = product_in.name.strip()
        if product_in.description is not None:
            product.description = product_in.description.strip() if product_in.description else None
        if product_in.low_stock_threshold is not None:
            product.low_stock_threshold = product_in.low_stock_threshold
        if product_in.category_id is not None:
            product.category_id = product_in.category_id
        if product_in.sku is not None:
            product.sku = product_in.sku.strip() if product_in.sku else None

        db.commit()
        db.refresh(product)
        res = serialize_product(product)
        res["status"] = "UPDATED"
        res["message"] = "Product details updated successfully."
        return res

    # ADMIN ROLE: Full authority to change price, stock, and all attributes immediately
    if has_price_change:
        if product_in.price < 0:
            raise HTTPException(status_code=400, detail="Price cannot be negative")
        old_price = product.price
        new_price = product_in.price
        product.price = new_price
        log = ActivityLog(
            business_id=current_user.business_id,
            user_id=current_user.id,
            user_name=current_user.name,
            action="PRICE_CHANGE",
            entity_type="product",
            entity_id=product.id,
            entity_name=product.name,
            details=f"Admin {current_user.name} changed price of '{product.name}' from {old_price:.2f} ETB to {new_price:.2f} ETB.",
            status="LOGGED"
        )
        db.add(log)

    if has_stock_change:
        if product_in.stock_quantity < 0:
            raise HTTPException(status_code=400, detail="Stock quantity cannot be negative")
        old_stock = product.stock_quantity
        new_stock = product_in.stock_quantity
        product.stock_quantity = new_stock
        log = ActivityLog(
            business_id=current_user.business_id,
            user_id=current_user.id,
            user_name=current_user.name,
            action="STOCK_UPDATE",
            entity_type="product",
            entity_id=product.id,
            entity_name=product.name,
            details=f"Admin {current_user.name} adjusted stock of '{product.name}' from {old_stock} to {new_stock} units.",
            status="LOGGED"
        )
        db.add(log)

    if product_in.name is not None:
        product.name = product_in.name.strip()
    if product_in.description is not None:
        product.description = product_in.description.strip() if product_in.description else None
    if product_in.low_stock_threshold is not None:
        product.low_stock_threshold = product_in.low_stock_threshold
    if product_in.category_id is not None:
        product.category_id = product_in.category_id
    if product_in.sku is not None:
        product.sku = product_in.sku.strip() if product_in.sku else None

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

    # If employee, forbid permanent delete and submit deletion request to admin
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

        log = ActivityLog(
            business_id=current_user.business_id,
            user_id=current_user.id,
            user_name=current_user.name,
            action="DELETE_REQUEST",
            entity_type="product",
            entity_id=product.id,
            entity_name=product.name,
            details=f"Employee {current_user.name} requested permanent deletion of '{product.name}' (Stock: {product.stock_quantity}, Price: {product.price:.2f} ETB). Requires administrator approval.",
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
