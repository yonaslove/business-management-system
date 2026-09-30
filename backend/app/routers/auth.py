from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.business import Business
from app.schemas.auth import LoginRequest, RegisterRequest, Token
from app.schemas.user import UserOut
from app.core.security import verify_password, get_password_hash, create_access_token
from app.routers.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists"
        )

    # Create business
    business = Business(
        name=req.business_name.strip(),
        phone=req.phone.strip() if req.phone else None,
        email=req.email.lower().strip(),
        address=req.address.strip() if req.address else None
    )
    db.add(business)
    db.flush()  # get business.id

    # Create user
    hashed = get_password_hash(req.password)
    user = User(
        name=req.owner_name.strip(),
        email=req.email.lower().strip(),
        password_hash=hashed,
        business_id=business.id
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "business_id": business.id,
            "business_name": business.name
        }
    }


@router.post("/login", response_model=Token)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = create_access_token(subject=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "business_id": user.business_id,
            "business_name": user.business.name if user.business else "My Business"
        }
    }


@router.post("/demo-login", response_model=Token)
def demo_login(db: Session = Depends(get_db)):
    """1-click demo login convenience endpoint for instant evaluation."""
    user = db.query(User).filter(User.email == "demo@yonimarket.et").first()
    if not user:
        # Fallback to first user in database
        user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="Demo account not found. Please restart server to seed data.")

    token = create_access_token(subject=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "business_id": user.business_id,
            "business_name": user.business.name if user.business else "Yoni Mini Market"
        }
    }


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
