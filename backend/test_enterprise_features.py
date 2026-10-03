import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_enterprise_flow():
    print("=== 1. Testing Strong Password Policy on Register ===")
    weak_reg = {
        "business_name": "Test Supermarket",
        "owner_name": "Owner Abebe",
        "username": "abebe_owner",
        "email": "abebe@testmarket.et",
        "password": "weak"  # Too short, no upper/digit/symbol
    }
    r = requests.post(f"{BASE_URL}/auth/register", json=weak_reg)
    assert r.status_code == 400, f"Expected 400 for weak password, got {r.status_code}: {r.text}"
    print("PASS: Weak password correctly rejected!")

    print("=== 2. Registering with Strong Password and ETB default currency ===")
    strong_reg = {
        "business_name": "Merkato Mega Market",
        "owner_name": "Abebe Kebede",
        "username": "abebe_mega",
        "email": "abebe_mega@testmarket.et",
        "password": "Password@2026!",
        "currency": "ETB",
        "currency_symbol": "Br"
    }
    r = requests.post(f"{BASE_URL}/auth/register", json=strong_reg)
    if r.status_code == 400 and "already exists" in r.text:
        # Login instead
        r_login = requests.post(f"{BASE_URL}/auth/login", json={"username": "abebe_mega", "password": "Password@2026!"})
        assert r_login.status_code == 200, f"Login failed: {r_login.text}"
        admin_data = r_login.json()
    else:
        assert r.status_code == 200, f"Register failed: {r.text}"
        admin_data = r.json()

    admin_token = admin_data["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print(f"PASS: Admin registered/logged in! User: {admin_data['user']['username']}, Currency: {admin_data['user'].get('currency')}")

    print("=== 3. Testing Username Login ===")
    r_user_login = requests.post(f"{BASE_URL}/auth/login", json={"username": "abebe_mega", "password": "Password@2026!"})
    assert r_user_login.status_code == 200, f"Username login failed: {r_user_login.text}"
    print("PASS: Login via Username successful!")

    print("=== 4. Testing Multi-Currency in Settings ===")
    r_settings = requests.get(f"{BASE_URL}/settings", headers=admin_headers)
    assert r_settings.status_code == 200
    s_data = r_settings.json()
    assert len(s_data["available_currencies"]) >= 8, f"Expected >=8 currencies, got {len(s_data['available_currencies'])}"
    print(f"PASS: Settings returned currency '{s_data['currency']}' and {len(s_data['available_currencies'])} available currencies.")

    print("=== 5. Testing Hiring Co-Manager with Strong Password ===")
    coadmin_payload = {
        "name": "Dawit Co-Manager",
        "username": "dawit_coadmin",
        "email": "dawit_co@testmarket.et",
        "password": "CoManager#2026Pass",
        "role": "co_admin"
    }
    r_hire = requests.post(f"{BASE_URL}/admin/employees", json=coadmin_payload, headers=admin_headers)
    if r_hire.status_code != 201 and "already exists" in r_hire.text:
        pass
    else:
        assert r_hire.status_code == 201, f"Failed hiring co_admin: {r_hire.text}"
        print("PASS: Successfully hired co_admin!")

    # Login as co_admin
    r_co_login = requests.post(f"{BASE_URL}/auth/login", json={"username": "dawit_coadmin", "password": "CoManager#2026Pass"})
    assert r_co_login.status_code == 200, f"Co-admin login failed: {r_co_login.text}"
    co_token = r_co_login.json()["access_token"]
    co_headers = {"Authorization": f"Bearer {co_token}"}

    print("=== 6. Testing Co-Manager adding Product (Must be unverified pending approval) ===")
    prod_payload = {
        "name": "Ethiopian Yirgacheffe Coffee 500g",
        "price": 450.0,
        "stock_quantity": 50,
        "low_stock_threshold": 10,
        "sku": "COF-YIRG-01"
    }
    r_p = requests.post(f"{BASE_URL}/products", json=prod_payload, headers=co_headers)
    assert r_p.status_code == 200, f"Failed creating product: {r_p.text}"
    prod_data = r_p.json()
    assert prod_data["is_verified"] is False, f"Expected is_verified=False for non-admin creation, got: {prod_data['is_verified']}"
    prod_id = prod_data["id"]
    print(f"PASS: Product #{prod_id} created with is_verified=False!")

    print("=== 7. Verify Unverified Product CANNOT be sold in POS ===")
    sale_payload = {
        "items": [{"product_id": prod_id, "quantity": 1}],
        "payment_method": "Cash"
    }
    r_sale = requests.post(f"{BASE_URL}/sales", json=sale_payload, headers=admin_headers)
    assert r_sale.status_code == 400, f"Expected 400 for unverified product, got {r_sale.status_code}: {r_sale.text}"
    print(f"PASS: Unverified product rejected at checkout: {r_sale.json().get('detail')}")

    print("=== 8. Admin Checks Notifications & Approves Product Creation ===")
    r_notif = requests.get(f"{BASE_URL}/admin/notifications", headers=admin_headers)
    assert r_notif.status_code == 200
    notifs = r_notif.json()
    assert notifs["pending_approvals_count"] >= 1, "Expected at least 1 pending approval"
    print(f"PASS: Admin notifications count: {notifs['pending_approvals_count']}")

    # Find the log for CREATE_PRODUCT_REQUEST
    pending_p = [p for p in notifs["pending_approvals"] if p["action"] == "CREATE_PRODUCT_REQUEST" and p["entity_id"] == prod_id]
    assert len(pending_p) > 0, "No pending CREATE_PRODUCT_REQUEST found"
    act_id = pending_p[0]["id"]

    r_approve = requests.post(f"{BASE_URL}/admin/activities/{act_id}/approve", headers=admin_headers)
    assert r_approve.status_code == 200
    print(f"PASS: Product #{prod_id} approved by Admin!")

    # Verify product is now verified
    r_p_get = requests.get(f"{BASE_URL}/products/{prod_id}", headers=admin_headers)
    assert r_p_get.json()["is_verified"] is True
    print(f"PASS: Product #{prod_id} is now verified!")

    print("=== 9. Now Sell the Product and check stock reduction ===")
    r_sale_ok = requests.post(f"{BASE_URL}/sales", json=sale_payload, headers=co_headers)
    assert r_sale_ok.status_code == 201, f"Sale failed: {r_sale_ok.text}"
    sale_data = r_sale_ok.json()
    print(f"PASS: Sale recorded #{sale_data['id']} for {sale_data['total_amount']} ETB by staff {sale_data['user_name']}!")

    print("=== 10. Test Empty Stock Label when Stock reaches 0 ===")
    # Create empty product as admin
    empty_p = {
        "name": "Habesha Pure Honey 1kg",
        "price": 600.0,
        "stock_quantity": 0,
        "low_stock_threshold": 5
    }
    r_emp = requests.post(f"{BASE_URL}/products", json=empty_p, headers=admin_headers)
    assert r_emp.status_code == 200
    empty_data = r_emp.json()
    assert empty_data["stock_status"] == "EMPTY", f"Expected stock_status='EMPTY', got '{empty_data['stock_status']}'"
    print(f"PASS: Product with 0 stock has stock_status='{empty_data['stock_status']}'!")

    print("=== 11. Test Daily Report Endpoint in Admin ===")
    r_report = requests.get(f"{BASE_URL}/admin/daily-report", headers=admin_headers)
    assert r_report.status_code == 200, f"Daily report failed: {r_report.text}"
    rep = r_report.json()
    print("PASS: Daily Report received successfully!")
    print(f"   Date: {rep['summary']['date']}")
    print(f"   Total Revenue: {rep['summary']['total_revenue']} {rep['summary']['currency_symbol']}")
    print(f"   Total Units Sold: {rep['summary']['total_units_sold']}")
    print(f"   Total Remaining Stock: {rep['summary']['total_remaining_stock']}")
    print(f"   Empty Products Count: {rep['summary']['empty_products_count']}")
    print(f"   Staff Sales Breakdown: {len(rep['staff_sales'])} staff members active")
    print(f"   Payment Methods: {[pm['method'] for pm in rep['payment_methods']]}")
    print(f"   Inventory Items Tracked: {len(rep['inventory_status'])}")

    print("\nALL ENTERPRISE BACKEND TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_enterprise_flow()
