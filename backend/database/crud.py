from sqlalchemy.orm import Session
from . import models
from .schemas import ResumeAnalysisCreate, InterviewSessionCreate
from datetime import datetime
from typing import List


def save_resume_analysis(db: Session, payload: ResumeAnalysisCreate):
    analysis = models.ResumeAnalysis(
        user_id=payload.user_id,
        ats_score=payload.ats_score,
        matched_skills=payload.matched_skills,
        missing_skills=payload.missing_skills,
        semantic_scores=payload.semantic_scores,
        raw_report=payload.raw_report,
        created_at=datetime.utcnow(),
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


def save_interview_feedback(db: Session, payload: InterviewSessionCreate):
    session = models.InterviewSession(
        user_id=payload.user_id,
        question=payload.question,
        answer=payload.answer,
        feedback=payload.feedback,
        score=payload.score,
        created_at=datetime.utcnow(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_user_history(db: Session, user_id: int, limit: int = 50):
    analyses = (
        db.query(models.ResumeAnalysis)
        .filter(models.ResumeAnalysis.user_id == user_id)
        .order_by(models.ResumeAnalysis.created_at.desc())
        .limit(limit)
        .all()
    )

    interviews = (
        db.query(models.InterviewSession)
        .filter(models.InterviewSession.user_id == user_id)
        .order_by(models.InterviewSession.created_at.desc())
        .limit(limit)
        .all()
    )

    return {"analyses": analyses, "interviews": interviews}
import json
from typing import Iterable

from sqlalchemy.orm import Session

from .models import ATSProgressSnapshot, InterviewAttempt, InterviewSession


def create_progress_snapshot(db: Session, **kwargs) -> ATSProgressSnapshot:
    snapshot = ATSProgressSnapshot(**kwargs)
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)
    return snapshot


def create_interview_session(db: Session, **kwargs) -> InterviewSession:
    session = InterviewSession(**kwargs)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def update_interview_session(db: Session, session: InterviewSession, **kwargs) -> InterviewSession:
    for key, value in kwargs.items():
        setattr(session, key, value)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def create_interview_attempt(db: Session, **kwargs) -> InterviewAttempt:
    attempt = InterviewAttempt(**kwargs)
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt


def get_recent_progress_points(db: Session, user_id: int, limit: int = 12) -> list[dict]:
    rows = (
        db.query(ATSProgressSnapshot)
        .filter(ATSProgressSnapshot.user_id == user_id)
        .order_by(ATSProgressSnapshot.created_at.asc())
        .limit(limit)
        .all()
    )
    points: list[dict] = []
    for row in rows:
        points.append(
            {
                "created_at": row.created_at,
                "ats_score": row.ats_score,
                "semantic_match_percent": row.semantic_match_percent,
                "skill_score": row.skill_score,
                "experience_score": row.experience_score,
                "project_score": row.project_score,
                "education_score": row.education_score,
            }
        )
    return points


def get_recent_interview_sessions(db: Session, user_id: int, limit: int = 10) -> list[dict]:
    rows = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == user_id)
        .order_by(InterviewSession.updated_at.desc())
        .limit(limit)
        .all()
    )
    result: list[dict] = []
    for row in rows:
        result.append(
            {
                "id": row.id,
                "analysis_id": row.analysis_id,
                "session_token": row.session_token,
                "question_count": row.question_count,
                "current_index": row.current_index,
                "status": row.status,
                "context_json": row.context_json,
                "created_at": row.created_at,
                "updated_at": row.updated_at,
            }
        )
    return result
