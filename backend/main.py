from __future__ import annotations

import os
import re
from collections import Counter
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


VALID_SEQUENCE = re.compile(r"^[ATCGU]+$")
RiskLevel = Literal["low", "medium", "high"]


app = FastAPI(
    title="OffTarget MVP API",
    description="Genome engineering guide RNA analysis service.",
    version="1.0.0",
)

allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

frontend_origin = os.getenv("FRONTEND_ORIGIN")
if frontend_origin:
    allowed_origins.append(frontend_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    sequence: str = Field(..., min_length=1)


class Guide(BaseModel):
    sequence: str
    pam: str
    position: int
    gc_content: float
    score: float
    risk: RiskLevel
    risk_reason: str


class AnalyzeResponse(BaseModel):
    guides: list[Guide]
    best_guide: Guide | None


def normalize_sequence(sequence: str) -> str:
    cleaned = "".join(sequence.split()).upper().replace("U", "T")
    if not VALID_SEQUENCE.fullmatch(cleaned):
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Sequence may only contain A, T, C, G, or U.",
                "code": "INVALID_CHARACTERS",
            },
        )

    if not 20 <= len(cleaned) <= 200:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Sequence length must be between 20 and 200 bp.",
                "code": "INVALID_LENGTH",
            },
        )

    return cleaned


def gc_content(sequence: str) -> float:
    if not sequence:
        return 0
    gc_count = sequence.count("G") + sequence.count("C")
    return round((gc_count / len(sequence)) * 100, 1)


def has_homopolymer(sequence: str, run_length: int = 4) -> bool:
    return any(base * run_length in sequence for base in "ATCG")


def repeat_density(sequence: str) -> float:
    if len(sequence) < 4:
        return 0
    kmers = [sequence[i : i + 4] for i in range(len(sequence) - 3)]
    duplicate_count = sum(count - 1 for count in Counter(kmers).values() if count > 1)
    return duplicate_count / len(kmers)


def efficiency_score(guide: str, pam: str) -> float:
    gc = gc_content(guide) / 100
    gc_balance = max(0, 1 - abs(gc - 0.55) / 0.55)
    terminal_gc_bonus = 0.08 if guide[-1] in {"G", "C"} else 0
    pam_bonus = 0.07 if pam == "GGG" else 0.04
    homopolymer_penalty = 0.18 if has_homopolymer(guide) else 0
    repeat_penalty = min(0.2, repeat_density(guide) * 0.5)

    raw_score = 0.18 + (gc_balance * 0.68) + terminal_gc_bonus + pam_bonus
    return round(max(0, min(1, raw_score - homopolymer_penalty - repeat_penalty)), 2)


def classify_risk(guide: str, score: float) -> tuple[RiskLevel, str]:
    gc = gc_content(guide)
    density = repeat_density(guide)

    if gc < 25 or gc > 75:
        return "high", "Extreme GC content can reduce specificity and binding quality."
    if has_homopolymer(guide):
        return "high", "Contains a homopolymer run that may increase off-target behavior."
    if density > 0.22:
        return "medium", "Contains repeated short motifs that may appear elsewhere."
    if gc < 40 or gc > 65:
        return "medium", "GC content is outside the preferred 40-65% design window."
    if score < 0.55:
        return "medium", "Predicted efficiency is modest compared with other guides."
    return "low", "Balanced GC content and no obvious repetitive sequence risk."


def find_guides(sequence: str) -> list[Guide]:
    guides: list[Guide] = []

    for index in range(len(sequence) - 2):
        pam = sequence[index : index + 3]
        if pam[1:] != "GG" or index < 20:
            continue

        guide_sequence = sequence[index - 20 : index]
        score = efficiency_score(guide_sequence, pam)
        risk, risk_reason = classify_risk(guide_sequence, score)

        guides.append(
            Guide(
                sequence=guide_sequence,
                pam=pam,
                position=index + 1,
                gc_content=gc_content(guide_sequence),
                score=score,
                risk=risk,
                risk_reason=risk_reason,
            )
        )

    return guides


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
    sequence = normalize_sequence(payload.sequence)
    guides = find_guides(sequence)

    risk_rank = {"low": 0, "medium": 1, "high": 2}
    best_guide = max(
        guides,
        key=lambda guide: (guide.score, -risk_rank[guide.risk], guide.gc_content),
        default=None,
    )

    return AnalyzeResponse(guides=guides, best_guide=best_guide)
