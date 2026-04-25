from __future__ import annotations

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from database import get_db
from models import User
from utils.auth import verify_token


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail={"message": "Missing authorization token.", "code": "MISSING_TOKEN"},
        )

    payload = verify_token(credentials.credentials)
    user_id = payload.get("sub") if payload else None
    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail={"message": "Invalid or expired token.", "code": "INVALID_TOKEN"},
        )

    user = db.get(User, int(user_id))
    if user is None:
        raise HTTPException(
            status_code=401,
            detail={"message": "User no longer exists.", "code": "USER_NOT_FOUND"},
        )

    return user
