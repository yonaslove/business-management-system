from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.business import Business
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.customer import Customer
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.core.security import get_password_hash


def seed_demo_data(db: Session):
    # Check if database already has demo business
    existing = db.query(Business).filter(Business.name == "Yoni Mini Market").first()
    if existing:
        return

    # 1. Create Demo Business
    business = Business(
        name="Yoni Mini Market",
        phone="+251 91 122 3344",
        email="demo@yonimarket.et",
        address="Bole Medhanialem, Addis Ababa, Ethiopia"
    )
    db.add(business)
    db.flush()

    # 2. Create Demo User
    user = User(
        name="Yonas Demisse",
        email="demo@yonimarket.et",
        password_hash=get_password_hash("password123"),
        business_id=business.id
    )
    db.add(user)
    db.flush()

    # 3. Create Categories
    categories_data = [
        "Beverages",
        "Snacks & Bakery",
        "Groceries & Staples",
        "Hygiene & Personal Care"
    ]
    category_map = {}
    for cat_name in categories_data:
        cat = Category(name=cat_name, business_id=business.id)
        db.add(cat)
        db.flush()
        category_map[cat_name] = cat.id

    # 4. Create Realistic Ethiopian Products (in ETB)
    products_data = [
        {"name": "Coca Cola 330ml", "cat": "Beverages", "price": 45.0, "stock": 120, "threshold": 20, "sku": "BEV-001", "desc": "Cold glass bottle 330ml"},
        {"name": "Highland Mineral Water 1L", "cat": "Beverages", "price": 20.0, "stock": 85, "threshold": 20, "sku": "BEV-002", "desc": "Bottled natural mineral water"},
        {"name": "Wheat Biscuit", "cat": "Snacks & Bakery", "price": 35.0, "stock": 42, "threshold": 15, "sku": "SNK-001", "desc": "Pack of crispy wheat biscuits"},
        {"name": "Special White Bread", "cat": "Snacks & Bakery", "price": 25.0, "stock": 6, "threshold": 10, "sku": "BAK-001", "desc": "Fresh bakery bread loaf"},
        {"name": "Fresh Mango Juice 500ml", "cat": "Beverages", "price": 65.0, "stock": 28, "threshold": 10, "sku": "BEV-003", "desc": "Chilled pure mango juice"},
        {"name": "Laundry Soap Bar", "cat": "Hygiene & Personal Care", "price": 40.0, "stock": 4, "threshold": 12, "sku": "HYG-001", "desc": "All-purpose washing soap"},
        {"name": "Roasted Coffee Beans 500g", "cat": "Groceries & Staples", "price": 180.0, "stock": 24, "threshold": 8, "sku": "GRO-001", "desc": "Authentic Ethiopian roasted Arabica coffee"},
        {"name": "Refined White Sugar 1kg", "cat": "Groceries & Staples", "price": 90.0, "stock": 55, "threshold": 15, "sku": "GRO-002", "desc": "Packaged granulated sugar"},
        {"name": "Sunflower Cooking Oil 1L", "cat": "Groceries & Staples", "price": 260.0, "stock": 18, "threshold": 5, "sku": "GRO-003", "desc": "Refined pure sunflower oil"}
    ]

    product_map = {}
    for p in products_data:
        prod = Product(
            business_id=business.id,
            category_id=category_map[p["cat"]],
            name=p["name"],
            description=p["desc"],
            price=p["price"],
            stock_quantity=p["stock"],
            low_stock_threshold=p["threshold"],
            sku=p["sku"]
        )
        db.add(prod)
        db.flush()
        product_map[p["name"]] = prod

    # 5. Create Customers
    customers_data = [
        {"name": "Abebe Kebede", "phone": "0911554433", "email": "abebe@example.com", "address": "Bole Subcity, Woreda 03"},
        {"name": "Hana Tadesse", "phone": "0922334455", "email": "hana@example.com", "address": "Piazza, Arada"},
        {"name": "Dawit Alemu", "phone": "0933445566", "email": "dawit@example.com", "address": "Kazanchis, Kirkos"},
        {"name": "Selam Haile", "phone": "0944556677", "email": "selam@example.com", "address": "Sarbet, Nifas Silk"},
        {"name": "Meron Bekele", "phone": "0955667788", "email": "meron@example.com", "address": "Gerji, Bole"}
    ]

    customer_objs = []
    for c in customers_data:
        cust = Customer(
            business_id=business.id,
            name=c["name"],
            phone=c["phone"],
            email=c["email"],
            address=c["address"]
        )
        db.add(cust)
        db.flush()
        customer_objs.append(cust)

    # 6. Create Historical Sales (across previous 6 days and today)
    now = datetime.now(timezone.utc)
    sample_sales = [
        {
            "days_ago": 5,
            "cust_idx": 0,
            "pay": "Cash",
            "items": [("Coca Cola 330ml", 4), ("Wheat Biscuit", 2)]
        },
        {
            "days_ago": 4,
            "cust_idx": 1,
            "pay": "Telebirr",
            "items": [("Roasted Coffee Beans 500g", 1), ("Refined White Sugar 1kg", 2)]
        },
        {
            "days_ago": 3,
            "cust_idx": 2,
            "pay": "CBE Birr",
            "items": [("Highland Mineral Water 1L", 6), ("Fresh Mango Juice 500ml", 2)]
        },
        {
            "days_ago": 2,
            "cust_idx": 3,
            "pay": "Cash",
            "items": [("Sunflower Cooking Oil 1L", 1), ("Special White Bread", 2)]
        },
        {
            "days_ago": 1,
            "cust_idx": 4,
            "pay": "Telebirr",
            "items": [("Coca Cola 330ml", 6), ("Laundry Soap Bar", 3)]
        },
        {
            "days_ago": 0,
            "cust_idx": 0,
            "pay": "Cash",
            "items": [("Roasted Coffee Beans 500g", 2), ("Highland Mineral Water 1L", 4)]
        }
    ]

    for sale_spec in sample_sales:
        created_time = now - timedelta(days=sale_spec["days_ago"], hours=2)
        cust = customer_objs[sale_spec["cust_idx"]]

        # Calculate totals
        total_amount = 0.0
        sale_items_to_add = []
        for prod_name, qty in sale_spec["items"]:
            prod = product_map[prod_name]
            subtotal = round(prod.price * qty, 2)
            total_amount += subtotal
            sale_items_to_add.append({
                "product": prod,
                "quantity": qty,
                "unit_price": prod.price,
                "subtotal": subtotal
            })

        sale = Sale(
            business_id=business.id,
            customer_id=cust.id,
            total_amount=round(total_amount, 2),
            payment_method=sale_spec["pay"],
            created_at=created_time
        )
        db.add(sale)
        db.flush()

        for item in sale_items_to_add:
            si = SaleItem(
                sale_id=sale.id,
                product_id=item["product"].id,
                product_name=item["product"].name,
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                subtotal=item["subtotal"]
            )
            db.add(si)

    db.commit()
    print("Demo data seeded successfully for Yoni Mini Market!")
