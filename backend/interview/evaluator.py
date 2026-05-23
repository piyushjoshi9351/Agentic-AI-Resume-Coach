import logging
import os
import re
from typing import Any

from pydantic import BaseModel, Field

from ..services.llm_router import llm_router


logger = logging.getLogger(__name__)
AI_PROVIDER = os.getenv("AI_PROVIDER", "local").lower()


class InterviewEvaluationModel(BaseModel):
    score_out_of_10: float = Field(default=0.0, ge=0.0, le=10.0)
    strengths: list[str] = Field(default_factory=list)
    improvements: list[str] = Field(default_factory=list)
    technical_depth: float = Field(default=0.0, ge=0.0, le=10.0)
    clarity: float = Field(default=0.0, ge=0.0, le=10.0)
    confidence: float = Field(default=0.0, ge=0.0, le=10.0)
    communication: float = Field(default=0.0, ge=0.0, le=10.0)
    relevance: float = Field(default=0.0, ge=0.0, le=10.0)


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "")).strip().lower()


def _score_dimension(answer: str, question: str, keywords: list[str]) -> float:
    answer_text = _normalize(answer)
    question_terms = [token for token in _normalize(question).split() if len(token) > 3]
    keyword_hits = sum(1 for keyword in keywords if keyword and keyword.lower() in answer_text)
    question_hits = sum(1 for term in question_terms[:6] if term in answer_text)
    length_bonus = 1.0 if len(answer_text.split()) >= 60 else 0.5 if len(answer_text.split()) >= 25 else 0.0
    raw_score = min(10.0, (keyword_hits * 1.6) + (question_hits * 0.35) + (length_bonus * 1.5) + 3.0)
    return round(raw_score, 1)


def _heuristic_evaluation(question: str, answer: str, context: dict[str, Any] | None = None) -> dict:
    context = context or {}
    keywords = []
    if isinstance(context.get("focus_skills"), list):
        keywords.extend(str(item) for item in context["focus_skills"])
    if isinstance(context.get("ats_gaps"), list):
        keywords.extend(str(item) for item in context["ats_gaps"])

    technical_depth = _score_dimension(answer, question, keywords)
    relevance = _score_dimension(answer, question, [question.split()[0]] if question else [])
    clarity = 9.0 if len(answer.split()) >= 40 else 6.5 if len(answer.split()) >= 20 else 4.5
    confidence = 8.0 if any(word in _normalize(answer) for word in ["i led", "i built", "i delivered", "i implemented", "i owned"]) else 6.0
    communication = 8.5 if "." in answer and len(answer.split()) >= 25 else 6.0

    score = round((technical_depth * 0.3) + (clarity * 0.2) + (confidence * 0.2) + (communication * 0.15) + (relevance * 0.15), 1)

    strengths = []
    if technical_depth >= 7:
        strengths.append("Shows solid technical depth.")
    if clarity >= 7:
        strengths.append("Explains the answer clearly.")
    if confidence >= 7:
        strengths.append("Sounds confident and decisive.")
    if communication >= 7:
        strengths.append("Communicates in a structured way.")

    improvements = []
    if technical_depth < 7:
        improvements.append("Add more concrete technical details and tradeoffs.")
    if clarity < 7:
        improvements.append("Use a cleaner structure like STAR or a problem-solution-impact flow.")
    if confidence < 7:
        improvements.append("State your ownership and decisions more directly.")
    if relevance < 7:
        improvements.append("Tie the answer more directly to the question and role.")

    if not strengths:
        strengths.append("Provides an attempt at answering the question.")
    if not improvements:
        improvements.append("Keep the answer concise while preserving the strongest examples.")

    return {
        "score_out_of_10": score,
        "strengths": strengths,
        "improvements": improvements,
        "technical_depth": technical_depth,
        "clarity": clarity,
        "confidence": confidence,
        "communication": communication,
        "relevance": relevance,
    }


def evaluate_interview_answer(question: str, answer: str, context: dict[str, Any] | None = None) -> dict:
    context = context or {}
    system_prompt = """You evaluate interview answers for hiring readiness.
Score the response on technical depth, clarity, confidence, communication, and relevance.
Return strict JSON only."""

    user_prompt = f"""
QUESTION:
{question}

ANSWER:
{answer}

CONTEXT:
{context}

Return a score out of 10 with strengths and improvements."""

    if AI_PROVIDER != "gemini":
        return _heuristic_evaluation(question, answer, context)

    fallback = InterviewEvaluationModel().model_dump()
    response = llm_router.generate_json(
        schema_model=InterviewEvaluationModel,
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        fallback_data=fallback,
    )

    return {
        "score_out_of_10": float(response.get("score_out_of_10", fallback["score_out_of_10"])),
        "strengths": response.get("strengths", []),
        "improvements": response.get("improvements", []),
        "technical_depth": float(response.get("technical_depth", 0.0)),
        "clarity": float(response.get("clarity", 0.0)),
        "confidence": float(response.get("confidence", 0.0)),
        "communication": float(response.get("communication", 0.0)),
        "relevance": float(response.get("relevance", 0.0)),
    }