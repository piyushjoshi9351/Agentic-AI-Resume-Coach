from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from .db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(512), nullable=False)
    name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    ats_score = Column(Float, nullable=True)
    matched_skills = Column(JSONB, nullable=True)
    missing_skills = Column(JSONB, nullable=True)
    semantic_scores = Column(JSONB, nullable=True)
    raw_report = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="resume_analyses")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=True)
    feedback = Column(JSONB, nullable=True)
    score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="interview_sessions")
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class ATSProgressSnapshot(Base):
    __tablename__ = "ats_progress_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    analysis_id: Mapped[int | None] = mapped_column(ForeignKey("analysis_records.id"), nullable=True, index=True)
    ats_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    semantic_match_percent: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    skill_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    experience_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    project_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    education_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    matched_skills_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    missing_skills_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    analysis_id: Mapped[int | None] = mapped_column(ForeignKey("analysis_records.id"), nullable=True, index=True)
    session_token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    question_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    current_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="active", nullable=False)
    context_json: Mapped[str] = mapped_column(Text, default="{}", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    attempts: Mapped[list["InterviewAttempt"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
    )


class InterviewAttempt(Base):
    __tablename__ = "interview_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("interview_sessions.id"), nullable=False, index=True)
    question_index: Mapped[int] = mapped_column(Integer, nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    answer_text: Mapped[str] = mapped_column(Text, nullable=False)
    transcript_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    score_out_of_10: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    technical_depth: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    clarity: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    communication: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    relevance: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    strengths_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    improvements_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    feedback_json: Mapped[str] = mapped_column(Text, default="{}", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    session: Mapped[InterviewSession] = relationship(back_populates="attempts")
