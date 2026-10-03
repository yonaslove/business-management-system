from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.database.session import get_db
from app.models.user import User
from app.models.business import Business
from app.schemas.auth import LoginRequest, RegisterRequest, Token
from app.schemas.user import UserOut
from app.core.security import verify_password, get_password_hash, create_access_token, validate_password_strength
from app.routers.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # Validate password strength
    try:
        validate_password_strength(req.password)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )

    # Check if user with this email already exists
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists"
        )

    # Determine username
    clean_username = req.username.strip().lower() if req.username else req.email.split("@")[0].lower()
    existing_username = db.query(User).filter(func.lower(User.username) == clean_username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The username '{clean_username}' is already taken. Please choose another username."
        )

    # Create business
    currency = req.currency.strip().upper() if req.currency else "ETB"
    currency_symbol = req.currency_symbol.strip() if req.currency_symbol else "Br"

    business = Business(
        name=req.business_name.strip(),
        phone=req.phone.strip() if req.phone else None,
        email=req.email.lower().strip(),
        address=req.address.strip() if req.address else None,
        currency=currency,
        currency_symbol=currency_symbol
    )
    db.add(business)
    db.flush()  # get business.id

    # Create user with role='admin'
    hashed = get_password_hash(req.password)
    user = User(
        name=req.owner_name.strip(),
        username=clean_username,
        email=req.email.lower().strip(),
        password_hash=hashed,
        role="admin",
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
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "business_id": business.id,
            "business_name": business.name,
            "currency": business.currency,
            "currency_symbol": business.currency_symbol
        }
    }


@router.post("/login", response_model=Token)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    identifier = (req.username or req.email or "").strip().lower()
    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email is required to sign in."
        )

    user = db.query(User).filter(
        or_(
            func.lower(User.username) == identifier,
            func.lower(User.email) == identifier
        )
    ).first()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password. Please verify your credentials.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = create_access_token(subject=user.id)
    biz = user.business
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "username": user.username or user.email.split("@")[0],
            "email": user.email,
            "role": user.role,
            "business_id": user.business_id,
            "business_name": biz.name if biz else "My Business",
            "currency": biz.currency if biz else "ETB",
            "currency_symbol": biz.currency_symbol if biz else "Br"
        }
    }


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
