"""Database package for persistent models and CRUD helpers."""

from .db import Base, DATABASE_URL, IS_SQLITE, SessionLocal, engine, get_db, init_db
from .models import ATSProgressSnapshot, InterviewAttempt, InterviewSession
from .schemas import (
    ATSProgressPoint,
    InterviewAttemptCreate,
    InterviewAttemptResponse,
    InterviewSessionCreate,
    InterviewSessionResponse,
    TimelineResponse,
)

__all__ = [
    "Base",
    "DATABASE_URL",
    "IS_SQLITE",
    "SessionLocal",
    "engine",
    "get_db",
    "init_db",
    "ATSProgressSnapshot",
    "InterviewAttempt",
    "InterviewSession",
    "ATSProgressPoint",
    "InterviewAttemptCreate",
    "InterviewAttemptResponse",
    "InterviewSessionCreate",
    "InterviewSessionResponse",
    "TimelineResponse",
]
