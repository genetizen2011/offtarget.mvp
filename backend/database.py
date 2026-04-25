from __future__ import annotations

import os
from collections.abc import Generator

from dotenv import load_dotenv
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


def normalize_database_url(url: str | None) -> str | None:
    if url and url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


engine_url = normalize_database_url(DATABASE_URL)
engine = create_engine(engine_url, pool_pre_ping=True) if engine_url else None
SessionLocal = (
    sessionmaker(autocommit=False, autoflush=False, bind=engine) if engine else None
)
Base = declarative_base()


def init_db() -> None:
    if engine is not None:
        Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    if SessionLocal is None:
        raise HTTPException(
            status_code=503,
            detail={
                "message": "DATABASE_URL is not configured.",
                "code": "DATABASE_NOT_CONFIGURED",
            },
        )

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
