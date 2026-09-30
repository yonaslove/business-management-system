from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
import hashlib
import secrets
from jose import jwt
from app.core.config import settings

# Salt for hashlib fallback hashing
_HASH_SALT = "yonimarket-secure-salt-2026"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # Fallback to PBKDF2 sha256 with salt
        expected = get_password_hash(plain_password)
        return secrets.compare_digest(expected, hashed_password)


def get_password_hash(password: str) -> str:
    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.hash(password)
    except Exception:
        # Fallback to PBKDF2 sha256
        key = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            _HASH_SALT.encode('utf-8'),
            100000
        )
        return f"pbkdf2_sha256${key.hex()}"


def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        return None
