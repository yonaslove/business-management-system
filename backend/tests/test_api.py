import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.database.session import Base, get_db
from app.models import *

# In-memory SQLite with StaticPool so all connections share the same memory DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


def setup_module():
    Base.metadata.create_all(bind=engine)


def teardown_module():
    Base.metadata.drop_all(bind=engine)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_auth_and_product_flow():
    # 1. Register Owner (Admin)
    reg_data = {
        "business_name": "Test Market",
        "owner_name": "Test Owner",
        "email": "testowner@example.com",
        "password": "securepassword123",
        "phone": "0911000000"
    }
    r = client.post("/api/auth/register", json=reg_data)
    assert r.status_code == 200
    token = r.json()["access_token"]
    assert r.json()["user"]["role"] == "admin"
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create product
    prod_data = {
        "name": "Mirinda Orange 330ml",
        "price": 40.0,
        "stock_quantity": 50,
        "low_stock_threshold": 10
    }
    prod_res = client.post("/api/products", json=prod_data, headers=headers)
    assert prod_res.status_code == 200
    prod = prod_res.json()
    assert prod["name"] == "Mirinda Orange 330ml"
    assert prod["stock_status"] == "IN STOCK"

    # 3. Create customer
    cust_data = {
        "name": "Almaz Ayana",
        "phone": "0988776655"
    }
    cust_res = client.post("/api/customers", json=cust_data, headers=headers)
    assert cust_res.status_code == 200
    cust = cust_res.json()

    # 4. Create sale (Sell 5 Mirinda)
    sale_data = {
        "customer_id": cust["id"],
        "items": [
            {"product_id": prod["id"], "quantity": 5}
        ],
        "payment_method": "Cash"
    }
    sale_res = client.post("/api/sales", json=sale_data, headers=headers)
    assert sale_res.status_code == 201
    sale = sale_res.json()
    assert sale["total_amount"] == 200.0  # 5 * 40

    # 5. Check product stock decreased
    check_prod = client.get(f"/api/products/{prod['id']}", headers=headers).json()
    assert check_prod["stock_quantity"] == 45

    # 6. Reject sale exceeding stock (attempt to sell 50 when only 45 available)
    excess_sale = {
        "customer_id": cust["id"],
        "items": [
            {"product_id": prod["id"], "quantity": 50}
        ]
    }
    fail_res = client.post("/api/sales", json=excess_sale, headers=headers)
    assert fail_res.status_code == 400
    assert "Insufficient stock" in fail_res.json()["detail"]


def test_dashboard_summary():
    login_data = {
        "email": "testowner@example.com",
        "password": "securepassword123"
    }
    r = client.post("/api/auth/login", json=login_data)
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    dash = client.get("/api/dashboard/summary", headers=headers)
    assert dash.status_code == 200
    data = dash.json()
    assert data["total_revenue"] == 200.0
    assert data["total_sales"] == 1
    assert data["total_products"] == 1
    assert data["total_customers"] == 1


def test_employee_and_admin_controls():
    # 1. Admin logs in
    admin_login = client.post("/api/auth/login", json={
        "email": "testowner@example.com",
        "password": "securepassword123"
    })
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Admin hires an employee
    emp_res = client.post("/api/admin/employees", json={
        "name": "Bekele Cashier",
        "email": "bekele@example.com",
        "password": "employeepass123",
        "role": "employee"
    }, headers=admin_headers)
    assert emp_res.status_code == 201
    assert emp_res.json()["role"] == "employee"

    # 3. Employee logs in
    emp_login = client.post("/api/auth/login", json={
        "email": "bekele@example.com",
        "password": "employeepass123"
    })
    assert emp_login.status_code == 200
    emp_token = emp_login.json()["access_token"]
    emp_headers = {"Authorization": f"Bearer {emp_token}"}

    # 4. Employee cannot access admin route
    admin_check = client.get("/api/admin/employees", headers=emp_headers)
    assert admin_check.status_code == 403

    # 5. Create a product to test deletion request
    test_prod = client.post("/api/products", json={
        "name": "Test Snack",
        "price": 15.0,
        "stock_quantity": 20
    }, headers=admin_headers).json()

    # 6. Employee changes price -> recorded in audit log
    update_res = client.put(f"/api/products/{test_prod['id']}", json={
        "price": 18.5
    }, headers=emp_headers)
    assert update_res.status_code == 200
    assert update_res.json()["price"] == 18.5

    # 7. Employee attempts to delete product -> NOT deleted, reported to admin as PENDING_APPROVAL
    del_res = client.delete(f"/api/products/{test_prod['id']}", headers=emp_headers)
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "PENDING_APPROVAL"

    # Product still exists in DB
    prod_check = client.get(f"/api/products/{test_prod['id']}", headers=admin_headers)
    assert prod_check.status_code == 200

    # 8. Admin reviews activities
    activities = client.get("/api/admin/activities", headers=admin_headers).json()
    assert len(activities) >= 2
    # Verify price change and delete request are in audit log
    actions = [a["action"] for a in activities]
    assert "PRICE_CHANGE" in actions
    assert "DELETE_REQUEST" in actions

    # Find the delete request
    delete_req = next(a for a in activities if a["action"] == "DELETE_REQUEST")
    assert delete_req["status"] == "PENDING_APPROVAL"

    # 9. Admin approves deletion request -> permanently deletes product!
    appr_res = client.post(f"/api/admin/activities/{delete_req['id']}/approve", headers=admin_headers)
    assert appr_res.status_code == 200

    # Product is now permanently deleted
    prod_gone = client.get(f"/api/products/{test_prod['id']}", headers=admin_headers)
    assert prod_gone.status_code == 404
