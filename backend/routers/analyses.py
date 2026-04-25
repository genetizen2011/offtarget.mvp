from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import Analysis, User


router = APIRouter(prefix="/analyses", tags=["analyses"])


class AnalysisCreate(BaseModel):
    sequence: str = Field(..., min_length=1)
    results_json: dict[str, Any]


class AnalysisResponse(BaseModel):
    id: int
    sequence: str
    results_json: dict[str, Any]
    created_at: str


def serialize_analysis(analysis: Analysis) -> AnalysisResponse:
    return AnalysisResponse(
        id=analysis.id,
        sequence=analysis.sequence,
        results_json=analysis.results_json,
        created_at=analysis.created_at.isoformat(),
    )


@router.post("", response_model=AnalysisResponse)
def save_analysis(
    payload: AnalysisCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnalysisResponse:
    analysis = Analysis(
        user_id=current_user.id,
        sequence=payload.sequence,
        results_json=payload.results_json,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return serialize_analysis(analysis)


@router.get("", response_model=list[AnalysisResponse])
def list_analyses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AnalysisResponse]:
    analyses = (
        db.query(Analysis)
        .filter(Analysis.user_id == current_user.id)
        .order_by(Analysis.created_at.desc())
        .all()
    )
    return [serialize_analysis(analysis) for analysis in analyses]
