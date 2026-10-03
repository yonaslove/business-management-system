"""
End-to-End Verification Test for Bank Statement Receipt Upload, Admin Verification, and Delivery Flow.
"""
import sys
import json
from app.database.session import SessionLocal, engine
from app.models.business import Business
from app.models.product import Product
from app.models.user import User
from app.models.sale import Sale
from app.models.customer import Customer
from app.core.security import get_password_hash, create_access_token

def run_test():
    print("=== STARTING RECEIPT VERIFICATION & DELIVERY WORKFLOW TEST ===")
    db = SessionLocal()
    try:
        # 1. Check or create test business
        biz = db.query(Business).first()
        if not biz:
            biz = Business(name="Fresh Minimarket Addis", currency="ETB", currency_symbol="Br")
            db.add(biz)
            db.commit()
            db.refresh(biz)
        print(f"[OK] Business: {biz.name} (ID: {biz.id})")

        # 2. Check or create test admin user
        admin_user = db.query(User).filter(User.business_id == biz.id, User.role == "admin").first()
        if not admin_user:
            admin_user = User(
                name="Admin Manager",
                email="admin@freshminimarket.et",
                password_hash=get_password_hash("AdminPass123!"),
                role="admin",
                business_id=biz.id
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
        print(f"[OK] Admin User: {admin_user.name} (ID: {admin_user.id}, Role: {admin_user.role})")

        # 3. Check or create test delivery employee
        delivery_user = db.query(User).filter(User.business_id == biz.id, User.role == "delivery").first()
        if not delivery_user:
            delivery_user = User(
                name="Dawit Delivery Rider",
                email="dawit@freshminimarket.et",
                password_hash=get_password_hash("Delivery123!"),
                role="delivery",
                business_id=biz.id
            )
            db.add(delivery_user)
            db.commit()
            db.refresh(delivery_user)
        print(f"[OK] Delivery User: {delivery_user.name} (ID: {delivery_user.id}, Role: {delivery_user.role})")

        # 4. Check or create verified product with stock
        prod = db.query(Product).filter(Product.business_id == biz.id, Product.stock_quantity > 5).first()
        if not prod:
            prod = Product(
                business_id=biz.id,
                name="Fresh Milk 1L",
                price=120.0,
                stock_quantity=50,
                low_stock_threshold=10,
                is_verified=True
            )
            db.add(prod)
            db.commit()
            db.refresh(prod)
        print(f"[OK] Product: {prod.name} (Price: {prod.price}, Stock: {prod.stock_quantity})")

        # 5. Place online order with simulated bank payment screenshot & reference
        from app.routers.public_store import place_online_order, PublicOrderCreate, PublicOrderItem
        fake_receipt_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErmkJggg=="
        fake_bank_ref = "CBE-FT2409988123"

        order_req = PublicOrderCreate(
            business_id=biz.id,
            customer_name="Almaz Tefera",
            customer_phone="0911786543",
            delivery_address="Bole Atlas, Next to Boston Day Spa, Addis Ababa",
            payment_method="CBE Birr",
            payment_ref=fake_bank_ref,
            payment_receipt=fake_receipt_base64,
            notes="Please call before reaching gate #4",
            items=[PublicOrderItem(product_id=prod.id, quantity=2)]
        )

        res = place_online_order(order_req, db)
        order_id = res["order_id"]
        print(f"[OK] Order placed successfully! Order ID: #{order_id}")
        assert res["order_status"] == "PENDING_VERIFICATION", f"Expected PENDING_VERIFICATION, got {res['order_status']}"
        assert res["has_receipt"] == True

        # 6. Verify in list_sales online_only
        from app.routers.sales import list_sales, update_order_status
        from app.schemas.sale import OrderStatusUpdate

        online_sales = list_sales(online_only=True, current_user=admin_user, db=db)
        placed_sale = next((s for s in online_sales if s["id"] == order_id), None)
        assert placed_sale is not None, "Order should be in online_sales"
        assert placed_sale["order_status"] == "PENDING_VERIFICATION", f"Expected PENDING_VERIFICATION, got {placed_sale['order_status']}"
        assert placed_sale["payment_receipt"] == fake_receipt_base64, "Receipt data URL should match"
        assert placed_sale["payment_ref"] == fake_bank_ref, "Bank ref should match"
        print(f"[OK] Sale #{order_id} serialized correctly with status: {placed_sale['order_status']}")

        # 7. Admin / Co-Admin verifies the order payment
        verified_sale = update_order_status(
            sale_id=order_id,
            status_in=OrderStatusUpdate(status="VERIFIED", notes="Payment confirmed on CBE statement"),
            current_user=admin_user,
            db=db
        )
        assert verified_sale["order_status"] == "VERIFIED", f"Expected VERIFIED, got {verified_sale['order_status']}"
        print(f"[OK] Admin successfully verified Order #{order_id}! Status is now: {verified_sale['order_status']}")

        # 8. Delivery worker accesses delivery queue
        delivery_queue = list_sales(delivery_only=True, current_user=delivery_user, db=db)
        found_in_queue = next((s for s in delivery_queue if s["id"] == order_id), None)
        assert found_in_queue is not None, "Verified order must appear in delivery worker's queue!"
        assert found_in_queue["order_status"] == "VERIFIED"
        print(f"[OK] Order #{order_id} is visible in Delivery Driver Terminal queue ({len(delivery_queue)} total in queue)")

        # 9. Delivery worker starts delivery / marks dispatched
        dispatched_sale = update_order_status(
            sale_id=order_id,
            status_in=OrderStatusUpdate(status="DISPATCHED", delivery_notes="Picked up from store, rider in transit"),
            current_user=delivery_user,
            db=db
        )
        assert dispatched_sale["order_status"] == "DISPATCHED"
        assert dispatched_sale["delivery_user_name"] == delivery_user.name
        print(f"[OK] Delivery Driver dispatched Order #{order_id}! Assigned Driver: {dispatched_sale['delivery_user_name']}")

        # 10. Delivery worker completes delivery
        delivered_sale = update_order_status(
            sale_id=order_id,
            status_in=OrderStatusUpdate(status="DELIVERED", delivery_notes="Handed to customer Almaz at gate"),
            current_user=delivery_user,
            db=db
        )
        assert delivered_sale["order_status"] == "DELIVERED"
        print(f"[OK] Delivery Driver completed delivery for Order #{order_id}! Status: {delivered_sale['order_status']}")

        print("\n=== ALL E2E VERIFICATION & DELIVERY WORKFLOW TESTS PASSED PERFECTLY ===")
    finally:
        db.close()

if __name__ == "__main__":
    run_test()
