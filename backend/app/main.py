from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.session import engine, Base
from app.models import *  # Import all models to ensure metadata registration
from app.routers import auth, products, customers, sales, dashboard, admin, settings as settings_router, public_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Database Tables
    try:
        Base.metadata.create_all(bind=engine)

        # Auto-migrate columns if tables existed without new columns
        with engine.connect() as conn:
            def add_column_if_missing(table, col, col_type, default=None):
                try:
                    if engine.dialect.name == "sqlite":
                        cursor = conn.exec_driver_sql(f"PRAGMA table_info({table})")
                        columns = [row[1] for row in cursor.fetchall()]
                        if columns and col not in columns:
                            default_clause = f" DEFAULT {default}" if default is not None else ""
                            conn.exec_driver_sql(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}{default_clause}")
                            conn.commit()
                    else:  # postgresql
                        default_clause = f" DEFAULT {default}" if default is not None else ""
                        conn.exec_driver_sql(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {col_type}{default_clause}")
                        conn.commit()
                except Exception:
                    pass

            add_column_if_missing("users", "role", "VARCHAR(50)", "'admin'")
            add_column_if_missing("users", "username", "VARCHAR(100)")
            add_column_if_missing("activity_logs", "payload", "TEXT")
            add_column_if_missing("businesses", "currency", "VARCHAR(10)", "'ETB'")
            add_column_if_missing("businesses", "currency_symbol", "VARCHAR(10)", "'Br'")
            add_column_if_missing("businesses", "payment_phone", "VARCHAR(50)")
            add_column_if_missing("businesses", "payment_account_name", "VARCHAR(255)")
            add_column_if_missing("businesses", "cbe_account", "VARCHAR(100)")
            add_column_if_missing("businesses", "other_bank_info", "VARCHAR(255)")
            add_column_if_missing("businesses", "payment_instructions", "TEXT")
            add_column_if_missing("products", "is_verified", "BOOLEAN", "TRUE")
            add_column_if_missing("customers", "is_verified", "BOOLEAN", "TRUE")
            add_column_if_missing("customers", "password_hash", "VARCHAR(255)")
            add_column_if_missing("sales", "user_id", "INTEGER")
            add_column_if_missing("sales", "payment_receipt", "TEXT")
            add_column_if_missing("sales", "payment_ref", "VARCHAR(100)")
            add_column_if_missing("sales", "delivery_notes", "TEXT")
            add_column_if_missing("sales", "delivery_user_id", "INTEGER")
            add_column_if_missing("sales", "delivery_proof_image", "TEXT")
            add_column_if_missing("sales", "customer_acknowledged", "BOOLEAN", "FALSE")
            add_column_if_missing("sales", "customer_acknowledged_at", "TIMESTAMP")
            add_column_if_missing("sales", "customer_feedback", "TEXT")
        print("Database connected and schema initialized successfully.")
    except Exception as exc:
        print(f"Warning: Database initialization encountered error on startup: {exc}")
        print("Server will start; please verify DATABASE_URL credentials.")

    yield



app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Business & Retail Management System for Ethiopian Businesses with Role-Based Controls",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(products.router, prefix=settings.API_V1_STR)
app.include_router(customers.router, prefix=settings.API_V1_STR)
app.include_router(sales.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(settings_router.router, prefix=settings.API_V1_STR)
app.include_router(public_store.router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database": "connected"
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to Business Management System API",
        "docs_url": "/docs",
        "health_url": "/health"
    }
