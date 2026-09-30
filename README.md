# Business Management System — Yoni Mini Market

A clean, responsive, and robust business management system tailored for small Ethiopian retail businesses (mini markets, grocery stores, boutique shops, spare parts, electronics). Designed to transition small businesses away from notebooks, Excel sheets, and mental accounting to an automated, centralized platform.

---

## 🌟 Overview & Working Demo

* **Business Name**: Yoni Mini Market
* **Currency**: Ethiopian Birr (ETB)
* **Demo Account**: `demo@yonimarket.et` / `password123`

---

## 🚀 Key Features

* **Authentication & Business Isolation**: Multi-tenant architecture with JWT token-based auth.
* **Modern Dashboard**: Real-time business KPIs (Total Revenue, Total Sales Count, Inventory Count, Low-stock alerts) alongside interactive sales trend charts and recent transactions.
* **Product Management**: Track products, categories, unit prices in ETB, current inventory stock, and customizable low-stock alert thresholds.
* **Customer Management**: Centralized customer records, phone numbers, contact info, and lifetime purchase history.
* **Point-of-Sale (POS) & Sales Recording**: Instant stock verification, atomic database transactions preventing negative inventory, dynamic subtotal calculations, and immediate stock reduction upon confirmation.
* **Real-time Inventory Tracking**: Clear stock status badges (`IN STOCK`, `LOW STOCK`, `OUT OF STOCK`).
* **Search & Filters**: Quick search by product name, category, customer phone/name, and date ranges.

---

## 🛠️ Architecture & Tech Stack

```text
                     CLIENT (Browser)
                            │
                            ↓
             Next.js 14+ (React / TypeScript / Tailwind CSS)
                            │
                            │ REST API (JSON / JWT Bearer)
                            ↓
               FastAPI (Python 3.10+ / Pydantic v2)
                            │
                            │ SQLAlchemy ORM
                            ↓
               PostgreSQL / SQLite Database
```

* **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide Icons
* **Backend**: FastAPI, Python, SQLAlchemy, Pydantic, Passlib / Bcrypt, Python-JOSE (JWT)
* **Database**: SQLite (local development default zero-config) & PostgreSQL (production-ready via `DATABASE_URL`)

---

## 📁 Directory Structure

```text
business-management-system/
├── frontend/               # Next.js frontend application
│   ├── app/                # App Router pages (landing, login, dashboard, products, customers, sales)
│   ├── components/         # Reusable UI components (Sidebar, Header, StatCard, Modals)
│   ├── lib/                # API client, auth state, formatting helpers
│   └── types/              # TypeScript interface definitions
├── backend/                # FastAPI backend application
│   ├── app/
│   │   ├── core/           # Configuration, security, JWT helpers
│   │   ├── database/       # SQLAlchemy engine and session handling
│   │   ├── models/         # Database models (User, Business, Product, Category, Customer, Sale)
│   │   ├── schemas/        # Pydantic validation schemas
│   │   ├── routers/        # API route handlers (/auth, /products, /customers, /sales, /dashboard)
│   │   └── services/       # Sales transaction logic & Demo seed data
│   ├── requirements.txt    # Python backend dependencies
│   └── .env.example        # Backend environment variables
├── docs/                   # Architecture notes, API specifications
├── screenshots/            # UI screenshots and previews
├── README.md
├── roadmap.md
└── todo.md
```

---

## ⚡ Quick Start & Running Locally

### 1. Backend Setup (FastAPI)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn app.main:app --reload --port 8000
```

* API Docs (Swagger UI): [http://localhost:8000/docs](http://localhost:8000/docs)
* Health check: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Frontend Setup (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

* Open [http://localhost:3000](http://localhost:3000) in your browser.
* Use the **Demo Login** button or sign in with:
  * **Email**: `demo@yonimarket.et`
  * **Password**: `password123`

---

## 🔑 Core API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a new business & owner |
| `POST` | `/auth/login` | Login and receive JWT access token |
| `GET` | `/auth/me` | Fetch current logged-in user profile |
| `GET` | `/dashboard/summary` | KPI metrics (Revenue, Sales, Products, Low Stock) |
| `GET` | `/dashboard/sales` | Sales trend history for charts |
| `GET` | `/products` | List & search products with stock status |
| `POST` | `/products` | Create a new product |
| `PUT` | `/products/{id}` | Update product details or stock |
| `DELETE` | `/products/{id}` | Remove a product |
| `GET` | `/customers` | List customers with total purchase history |
| `POST` | `/customers` | Register a customer |
| `GET` | `/sales` | List past sales records |
| `POST` | `/sales` | Atomic checkout (validates stock, deducts inventory, records sale) |

---

## 🛡️ License

MIT License. Built for Ethiopian Small Businesses.
