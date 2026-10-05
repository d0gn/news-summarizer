import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.entities import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

SECRET_KEY = "news-summarizer-super-secret-key-change-in-production"
TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000
    ).hex()
    return f"{salt}${pwd_hash}"


def verify_password(password: str, hashed: str) -> bool:
    try:
        salt, pwd_hash = hashed.split("$")
        computed = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000
        ).hex()
        return computed == pwd_hash
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    # Simple token scheme using signed/encoded json or random token mapped in memory/db.
    # For a robust zero-dependency approach, we can encode email + expiry into a base64 string or use secrets token.
    # To keep it simple and reliable without external jwt lib, let's create a token format: base64(email:expires_timestamp:signature)
    import base64
    import hmac

    payload_str = f"{data.get('sub')}:{int((datetime.utcnow() + (expires_delta or timedelta(days=7))).timestamp())}"
    signature = hmac.new(SECRET_KEY.encode(), payload_str.encode(), hashlib.sha256).hexdigest()
    token_raw = f"{payload_str}:{signature}"
    return base64.urlsafe_b64encode(token_raw.encode()).decode()


def verify_access_token(token: str) -> Optional[str]:
    try:
        import base64
        import hmac

        token_raw = base64.urlsafe_b64decode(token.encode()).decode()
        parts = token_raw.split(":")
        if len(parts) != 3:
            return None
        email, exp_str, signature = parts
        if datetime.utcnow().timestamp() > float(exp_str):
            return None
        payload_str = f"{email}:{exp_str}"
        expected_sig = hmac.new(SECRET_KEY.encode(), payload_str.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected_sig):
            return None
        return email
    except Exception:
        return None


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    email = verify_access_token(token)
    if not email:
        raise credentials_exception
    
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    user = result.scalars().first()
    if not user or not user.is_active:
        raise credentials_exception
    return user
