from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database.session import get_db
from app.models.user import User
from app.models.product import Product
from app.models.category import Category
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductOut,
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


@router.put("/products/{product_id}", response_model=ProductOut)
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

    if product_in.name is not None:
        product.name = product_in.name.strip()
    if product_in.description is not None:
        product.description = product_in.description.strip() if product_in.description else None
    if product_in.price is not None:
        if product_in.price < 0:
            raise HTTPException(status_code=400, detail="Price cannot be negative")
        product.price = product_in.price
    if product_in.stock_quantity is not None:
        if product_in.stock_quantity < 0:
            raise HTTPException(status_code=400, detail="Stock quantity cannot be negative")
        product.stock_quantity = product_in.stock_quantity
    if product_in.low_stock_threshold is not None:
        product.low_stock_threshold = product_in.low_stock_threshold
    if product_in.category_id is not None:
        product.category_id = product_in.category_id
    if product_in.sku is not None:
        product.sku = product_in.sku.strip() if product_in.sku else None

    db.commit()
    db.refresh(product)
    return serialize_product(product)


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

    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}
