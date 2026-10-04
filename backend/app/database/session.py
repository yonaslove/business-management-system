import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger("bms.database")

connect_args = {}
db_url = (settings.DATABASE_URL or "").strip().strip("'\"")

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

if not db_url or db_url.startswith("sqlite"):
    db_url = db_url or "sqlite:///./bms.db"
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        echo=False
    )
except Exception as exc:
    logger.error(f"Failed to create database engine for '{db_url}': {exc}. Using fallback SQLite database.")
    print(f"Warning: Failed to create database engine with '{db_url}': {exc}. Using fallback SQLite database.")
    engine = create_engine("sqlite:///./bms.db", connect_args={"check_same_thread": False}, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
