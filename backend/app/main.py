from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.session import engine, Base
from app.models import *  # Import all models to ensure metadata registration
from app.routers import auth, products, customers, sales, dashboard, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Database Tables
    Base.metadata.create_all(bind=engine)

    # Auto-migrate SQLite columns if table already existed without new columns
    if engine.dialect.name == "sqlite":
        with engine.connect() as conn:
            try:
                cursor = conn.exec_driver_sql("PRAGMA table_info(users)")
                columns = [row[1] for row in cursor.fetchall()]
                if columns and "role" not in columns:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'admin'")
                    conn.commit()
            except Exception:
                pass

            try:
                cursor = conn.exec_driver_sql("PRAGMA table_info(activity_logs)")
                columns = [row[1] for row in cursor.fetchall()]
                if columns and "payload" not in columns:
                    conn.exec_driver_sql("ALTER TABLE activity_logs ADD COLUMN payload TEXT")
                    conn.commit()
            except Exception:
                pass

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


@app.get("/health", tags=["Health"])
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
