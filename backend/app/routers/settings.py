import json
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.user import User
from app.models.business import Business
from app.models.activity_log import ActivityLog
from app.schemas.settings import (
    BusinessSettingsOut,
    BusinessSettingsUpdate,
    SettingsResponse,
    CurrencyInfo
)
from app.core.security import get_password_hash, validate_password_strength
from app.routers.deps import get_current_user

router = APIRouter(prefix="/settings", tags=["Settings & Profile"])

SUPPORTED_CURRENCIES = [
    {"code": "ETB", "name": "Ethiopian Birr (Default)", "symbol": "Br"},
    {"code": "USD", "name": "US Dollar", "symbol": "$"},
    {"code": "EUR", "name": "Euro", "symbol": "€"},
    {"code": "GBP", "name": "British Pound", "symbol": "£"},
    {"code": "KES", "name": "Kenyan Shilling", "symbol": "KSh"},
    {"code": "AED", "name": "UAE Dirham", "symbol": "AED"},
    {"code": "SAR", "name": "Saudi Riyal", "symbol": "SAR"},
    {"code": "CNY", "name": "Chinese Yuan", "symbol": "¥"},
]

CURRENCY_SYMBOL_MAP = {c["code"]: c["symbol"] for c in SUPPORTED_CURRENCIES}


def build_settings_out(biz: Business) -> dict:
    return {
        "id": biz.id,
        "name": biz.name,
        "email": biz.email,
        "phone": biz.phone,
        "address": biz.address,
        "currency": biz.currency or "ETB",
        "currency_symbol": biz.currency_symbol or "Br",
        "payment_phone": getattr(biz, "payment_phone", None),
        "payment_account_name": getattr(biz, "payment_account_name", None),
        "cbe_account": getattr(biz, "cbe_account", None),
        "other_bank_info": getattr(biz, "other_bank_info", None),
        "payment_instructions": getattr(biz, "payment_instructions", None),
        "available_currencies": SUPPORTED_CURRENCIES
    }


# =====================================================================
# BUSINESS PROFILE & CURRENCY (EXCLUSIVELY FOR ADMIN)
# =====================================================================
@router.get("", response_model=BusinessSettingsOut)
def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Business profile and currency settings are exclusively accessible to the Business Administrator."
        )

    biz = db.query(Business).filter(Business.id == current_user.business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business profile not found")
    return build_settings_out(biz)


@router.put("", response_model=SettingsResponse)
def update_settings(
    update_in: BusinessSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Only the Business Administrator can modify business profile and currency settings."
        )

    biz = db.query(Business).filter(Business.id == current_user.business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business profile not found")

    payload_dict = {}
    if update_in.name is not None and update_in.name.strip():
        payload_dict["name"] = update_in.name.strip()
    if update_in.email is not None:
        payload_dict["email"] = update_in.email.strip().lower() if update_in.email else None
    if update_in.phone is not None:
        payload_dict["phone"] = update_in.phone.strip() if update_in.phone else None
    if update_in.address is not None:
        payload_dict["address"] = update_in.address.strip() if update_in.address else None
    if update_in.currency is not None:
        cur_code = update_in.currency.strip().upper()
        payload_dict["currency"] = cur_code
        payload_dict["currency_symbol"] = (
            update_in.currency_symbol.strip()
            if update_in.currency_symbol
            else CURRENCY_SYMBOL_MAP.get(cur_code, "Br")
        )
    if update_in.payment_phone is not None:
        payload_dict["payment_phone"] = update_in.payment_phone.strip() if update_in.payment_phone else None
    if update_in.payment_account_name is not None:
        payload_dict["payment_account_name"] = update_in.payment_account_name.strip() if update_in.payment_account_name else None
    if update_in.cbe_account is not None:
        payload_dict["cbe_account"] = update_in.cbe_account.strip() if update_in.cbe_account else None
    if update_in.other_bank_info is not None:
        payload_dict["other_bank_info"] = update_in.other_bank_info.strip() if update_in.other_bank_info else None
    if update_in.payment_instructions is not None:
        payload_dict["payment_instructions"] = update_in.payment_instructions.strip() if update_in.payment_instructions else None

    if not payload_dict:
        return SettingsResponse(
            status="UNCHANGED",
            message="No changes were provided.",
            settings=build_settings_out(biz)
        )

    # Apply changes directly for Administrator
    if "name" in payload_dict:
        biz.name = payload_dict["name"]
    if "email" in payload_dict:
        biz.email = payload_dict["email"]
    if "phone" in payload_dict:
        biz.phone = payload_dict["phone"]
    if "address" in payload_dict:
        biz.address = payload_dict["address"]
    if "currency" in payload_dict:
        biz.currency = payload_dict["currency"]
        biz.currency_symbol = payload_dict["currency_symbol"]
    if "payment_phone" in payload_dict:
        biz.payment_phone = payload_dict["payment_phone"]
    if "payment_account_name" in payload_dict:
        biz.payment_account_name = payload_dict["payment_account_name"]
    if "cbe_account" in payload_dict:
        biz.cbe_account = payload_dict["cbe_account"]
    if "other_bank_info" in payload_dict:
        biz.other_bank_info = payload_dict["other_bank_info"]
    if "payment_instructions" in payload_dict:
        biz.payment_instructions = payload_dict["payment_instructions"]

    log = ActivityLog(
        business_id=biz.id,
        user_id=current_user.id,
        user_name=current_user.name,
        action="UPDATE_SETTINGS",
        entity_type="business",
        entity_id=biz.id,
        entity_name=biz.name,
        details=f"Administrator {current_user.name} updated business profile, currency to {biz.currency}, and online payment accounts.",
        payload=json.dumps(payload_dict),
        status="LOGGED"
    )
    db.add(log)
    db.commit()
    db.refresh(biz)

    return SettingsResponse(
        status="UPDATED",
        message="Business settings updated successfully.",
        settings=build_settings_out(biz)
    )


# =====================================================================
# PERSONAL USER PROFILE UPDATE
# Staff / Co-admin edition must be reported & approved before verified
# =====================================================================
class UserProfileUpdateIn(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None


@router.put("/profile")
def update_user_profile(
    profile_in: UserProfileUpdateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    changes = {}

    if profile_in.name is not None and profile_in.name.strip():
        if profile_in.name.strip() != current_user.name:
            changes["name"] = profile_in.name.strip()

    if profile_in.username is not None and profile_in.username.strip():
        clean_u = profile_in.username.strip().lower()
        if clean_u != (current_user.username or "").lower():
            # Check uniqueness
            exists = db.query(User).filter(
                func.lower(User.username) == clean_u,
                User.id != current_user.id
            ).first()
            if exists:
                raise HTTPException(
                    status_code=400,
                    detail=f"The username '{clean_u}' is already taken by another account."
                )
            changes["username"] = clean_u

    if profile_in.email is not None and profile_in.email.strip():
        clean_e = profile_in.email.strip().lower()
        if clean_e != current_user.email.lower():
            exists_email = db.query(User).filter(
                User.email == clean_e,
                User.id != current_user.id
            ).first()
            if exists_email:
                raise HTTPException(
                    status_code=400,
                    detail=f"The email address '{clean_e}' is already registered."
                )
            changes["email"] = clean_e

    if profile_in.password is not None and profile_in.password.strip():
        try:
            validate_password_strength(profile_in.password)
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))
        changes["password"] = profile_in.password

    if not changes:
        return {
            "status": "UNCHANGED",
            "message": "No profile changes were detected.",
            "user": {
                "id": current_user.id,
                "name": current_user.name,
                "username": current_user.username,
                "email": current_user.email,
                "role": current_user.role
            }
        }

    # If employee or co-admin: must be approved before verified
    if current_user.role != "admin":
        # Do not expose raw password in details string
        safe_changes = {k: ("********" if k == "password" else v) for k, v in changes.items()}
        log = ActivityLog(
            business_id=current_user.business_id,
            user_id=current_user.id,
            user_name=current_user.name,
            action="UPDATE_PROFILE_REQUEST",
            entity_type="user",
            entity_id=current_user.id,
            entity_name=current_user.name,
            details=(
                f"Staff member {current_user.name} (@{current_user.username}) submitted personal profile update: "
                f"{json.dumps(safe_changes)}. Administrator approval is required before verification."
            ),
            payload=json.dumps(changes),
            status="PENDING_APPROVAL"
        )
        db.add(log)
        db.commit()

        return {
            "status": "PENDING_APPROVAL",
            "message": "Profile update submitted successfully. As an employee / co-manager, your requested profile changes must be approved by the Business Administrator before taking effect.",
            "user": {
                "id": current_user.id,
                "name": current_user.name,
                "username": current_user.username,
                "email": current_user.email,
                "role": current_user.role
            }
        }

    # If administrator: apply immediately
    if "name" in changes:
        current_user.name = changes["name"]
    if "username" in changes:
        current_user.username = changes["username"]
    if "email" in changes:
        current_user.email = changes["email"]
    if "password" in changes:
        current_user.password_hash = get_password_hash(changes["password"])

    db.commit()
    db.refresh(current_user)

    return {
        "status": "UPDATED",
        "message": "Your profile has been updated successfully.",
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.role
        }
    }
