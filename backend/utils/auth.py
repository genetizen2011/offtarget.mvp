from __future__ import annotations

import os
from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt


ALGORITHM = "HS256"


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    secret_key = os.getenv("JWT_SECRET_KEY", "dev-only-change-me")
    expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    expire = datetime.now(UTC) + (
        expires_delta if expires_delta else timedelta(minutes=expire_minutes)
    )
    payload = data.copy()
    payload.update({"exp": expire})
    return jwt.encode(payload, secret_key, algorithm=ALGORITHM)


def verify_token(token: str) -> dict | None:
    secret_key = os.getenv("JWT_SECRET_KEY", "dev-only-change-me")
    try:
        return jwt.decode(token, secret_key, algorithms=[ALGORITHM])
    except JWTError:
        return None
