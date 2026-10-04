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

engine = None

if db_url.startswith("postgresql://") or db_url.startswith("postgresql+"):
    # Try primary PostgreSQL connection
    for candidate_url in [
        db_url,
        db_url.replace("postgresql://", "postgresql+psycopg2://", 1) if "psycopg2" not in db_url else None,
        db_url.replace("postgresql://", "postgresql+psycopg://", 1) if "psycopg" not in db_url else None,
    ]:
        if not candidate_url:
            continue
        try:
            engine = create_engine(candidate_url, connect_args=connect_args, echo=False)
            # Test a quick connection to verify driver availability
            with engine.connect() as test_conn:
                pass
            print(f"Successfully connected to PostgreSQL database.")
            break
        except Exception as exc:
            # If it's a driver import issue, continue to next candidate driver
            if "no module named" in str(exc).lower():
                continue
            # If driver exists but host/network/auth is waking up, keep this engine
            engine = create_engine(candidate_url, connect_args=connect_args, echo=False)
            break

if engine is None:
    try:
        engine = create_engine(db_url, connect_args=connect_args, echo=False)
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
