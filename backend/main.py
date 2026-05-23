"""
FastAPI Backend for AI Resume & Job Coach Application
A production-grade multi-agent AI system built with LangGraph + Google Gemini
"""

import os
import io
import json
import logging
import hashlib
import re
import time
import asyncio
import secrets
import binascii
from types import SimpleNamespace
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Optional
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from pypdf import PdfReader
from sqlalchemy.orm import Session
from sqlalchemy import text
from jose import jwt, JWTError
from passlib.context import CryptContext

# Load environment variables before importing modules that read env at import-time.
# Override stale terminal-session vars so .env edits take effect immediately.
load_dotenv(override=True)

from .graph import create_analysis_graph
from .db import init_db, get_db, User, AnalysisRecord, ResumeVersion, JobApplication, UserProfile
from .database.db import engine as database_engine
from .database.models import Base as DatabaseBase
from .services.cache import cache_client
from .services.job_parser import parse_job_url
from .services.pdf_export import generate_report_pdf_bytes
from .services.resume_service import calculate_resume_diff, generate_improved_resume
from .services.email_service import generate_follow_up_email, generate_interview_preparation_email
from .services.interview_analyzer import analyze_interview_answer
from .interview import generate_interview_questions, evaluate_interview_answer, normalize_transcript, extract_focus_skills
from .services.task_service import create_task, get_task, update_task, TaskStatus
from .ats import parse_resume_text, search_jobs
from .database.models import ATSProgressSnapshot, InterviewAttempt, InterviewSession, ResumeAnalysis
from .database.crud import (
    create_progress_snapshot,
    create_interview_session,
    update_interview_session,
    create_interview_attempt,
    get_recent_progress_points,
    get_recent_interview_sessions,
    save_resume_analysis,
    save_interview_feedback,
    get_user_history,
)
from .database.schemas import ATSProgressPoint, TimelineResponse, InterviewSessionResponse, ResumeAnalysisCreate, InterviewSessionCreate, ResumeAnalysisResponse

from .logging_config import configure_logging, log_json, generate_request_id

# Configure structured JSON logging
configure_logging()
import logging
logger = logging.getLogger(__name__)

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "120"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
http_bearer = HTTPBearer(auto_error=False)
rate_limit_buckets: dict[str, deque[float]] = defaultdict(deque)

# Initialize FastAPI app
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Application startup - initializing database")
    init_db()
    try:
        DatabaseBase.metadata.create_all(bind=database_engine)
        logger.info("Database tables ensured via SQLAlchemy create_all")
    except Exception as exc:
        logger.warning("Failed to create database tables: %s", exc)
    yield
    # Shutdown
    logger.info("🛑 Application shutdown")

app = FastAPI(
    title="AI Resume & Job Coach API",
    description="Multi-Agent AI system for resume analysis and career coaching",
    version="1.0.0",
    lifespan=lifespan
)

def _load_cors_origins() -> list[str]:
    raw_origins = os.getenv("CORS_ORIGINS", "")
    origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

    frontend_url = os.getenv("FRONTEND_URL", "").strip()
    if frontend_url and frontend_url not in origins:
        origins.append(frontend_url)

    if not origins:
        origins = [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
        ]

    return origins


def _load_cors_origin_regex() -> str:
    # Allow local dev origins such as Vite on localhost or private LAN IPs.
    return r"https?://(localhost|127\.0\.0\.1|10\.[0-9.]+|192\.168\.[0-9.]+|172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9.]+):(\d{2,5})"


# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=_load_cors_origins(),
    allow_origin_regex=_load_cors_origin_regex(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response models
class AnalysisResponse(BaseModel):
    """Response model for the analysis endpoint"""
    resume_analysis: dict
    job_match: dict
    cover_letter: str
    interview_questions: list
    analysis_id: Optional[int] = None


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class HistoryItem(BaseModel):
    id: int
    created_at: datetime
    resume_filename: str
    job_description: str
    job_url: Optional[str] = None
    parsed_job_data: Optional[dict] = None
    resume_analysis: dict
    job_match: dict
    cover_letter: str
    interview_questions: list


class AnalyticsSummary(BaseModel):
    total_analyses: int
    avg_ats_score: float
    best_ats_score: float
    analyses_last_7_days: int
    top_missing_skills: list[str]
    ats_progress_timeline: list[ATSProgressPoint] = Field(default_factory=list)
    recent_interview_sessions: list[InterviewSessionResponse] = Field(default_factory=list)


class JobParseRequest(BaseModel):
    url: str = Field(min_length=8, max_length=2048)


class JobParseResponse(BaseModel):
    title: str
    company: str
    location: str
    skills: list[str]
    responsibilities: list[str]
    experience_level: str
    raw_text: str


class JobSearchItem(BaseModel):
    title: str
    company: str
    description: str
    location: str
    job_url: Optional[str] = None
    employment_type: Optional[str] = None
    source: Optional[str] = None


class ResumeImproveRequest(BaseModel):
    analysis_id: int


class ResumeImproveResponse(BaseModel):
    improved_text: str
    confidence_score: float
    changes_summary: list[str]
    added_highlights: list[str]
    removed_items: list[str]


class ResumeDiffResponse(BaseModel):
    added: list[str]
    removed: list[str]
    improved_sections: list[str]


class JobApplicationRequest(BaseModel):
    company: str = Field(min_length=1, max_length=255)
    role: str = Field(min_length=1, max_length=255)
    status: str = Field(default="applied")
    job_url: Optional[str] = None
    notes: Optional[str] = None


class JobApplicationResponse(BaseModel):
    id: int
    company: str
    role: str
    status: str
    job_url: Optional[str]
    notes: Optional[str]
    applied_date: datetime
    updated_at: datetime


class UserProfileRequest(BaseModel):
    experience_level: Optional[str] = None
    target_role: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    language: str = "en"


class UserProfileResponse(BaseModel):
    experience_level: Optional[str]
    target_role: Optional[str]
    location: Optional[str]
    salary_range: Optional[str]
    language: str


class FollowUpEmailRequest(BaseModel):
    company: str = Field(min_length=1, max_length=255)
    role: str = Field(min_length=1, max_length=255)
    context: Optional[str] = None


class EmailResponse(BaseModel):
    success: bool
    email_body: str
    subject_line: str
    confidence: float
    error: Optional[str] = None


class InterviewAnswerRequest(BaseModel):
    question: str = Field(min_length=10)
    answer: str = Field(min_length=10)


class InterviewAnalysisResponse(BaseModel):
    success: bool
    has_issues: bool
    issues: list[str]
    improvements: list[str]
    strength_score: int
    confidence: float
    error: Optional[str] = None


class InterviewSessionStartRequest(BaseModel):
    analysis_id: int = Field(gt=0)


class InterviewSessionStartResponse(BaseModel):
    session_id: str
    analysis_id: int
    questions: list[dict]
    context: dict


class InterviewSessionEvaluateRequest(BaseModel):
    session_id: str = Field(min_length=8)
    question_index: int = Field(ge=0)
    question: str = Field(min_length=10)
    answer: str = Field(min_length=2)


class InterviewSessionEvaluateResponse(BaseModel):
    session_id: str
    question_index: int
    score_out_of_10: float
    strengths: list[str]
    improvements: list[str]
    technical_depth: float
    clarity: float
    confidence: float
    communication: float
    relevance: float
    transcript: str
    completed: bool = False
    next_question: Optional[dict] = None


class InterviewSessionStateResponse(BaseModel):
    session_id: str
    analysis_id: int
    questions: list[dict]
    responses: list[dict]
    current_index: int


class TaskResponse(BaseModel):
    task_id: str
    task_type: str
    status: str
    result: Optional[dict] = None
    error: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


def hash_password(password: str) -> str:
    """
    Hash password with safety measures:
    - Bcrypt has a 72-byte limit, so truncate
    - Use PBKDF2 SHA256 fallback for compatibility
    """
    import secrets
    import binascii
    
    # Truncate to 72 bytes for bcrypt compatibility
    truncated = password[:72]
    
    try:
        # Try to use passlib with bcrypt
        return pwd_context.hash(truncated)
    except Exception as e:
        logger.warning(f"Bcrypt hashing failed, using PBKDF2 fallback: {str(e)}")
        # Fallback to PBKDF2 SHA256 with salt
        salt = secrets.token_hex(32)
        hash_obj = hashlib.pbkdf2_hmac('sha256', truncated.encode(), salt.encode(), 100000)
        hash_hex = binascii.hexlify(hash_obj).decode()
        return f"pbkdf2_sha256${salt}${hash_hex}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password with fallback for different hash formats
    """
    import binascii
    
    # Truncate to 72 bytes for bcrypt compatibility
    truncated = plain_password[:72]
    
    # Check if it's a PBKDF2 hash (fallback format)
    if hashed_password.startswith("pbkdf2_sha256$"):
        parts = hashed_password.split("$")
        if len(parts) == 3:
            salt = parts[1]
            stored_hash = parts[2]
            hash_obj = hashlib.pbkdf2_hmac('sha256', truncated.encode(), salt.encode(), 100000)
            hash_hex = binascii.hexlify(hash_obj).decode()
            return hash_hex == stored_hash
    
    # Otherwise try passlib (bcrypt)
    try:
        return pwd_context.verify(truncated, hashed_password)
    except Exception as e:
        logger.warning(f"Password verification failed: {str(e)}")
        return False


def create_access_token(user_id: int, email: str) -> str:
    expire_at = datetime.now() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": expire_at,
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def serialize_user(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        created_at=user.created_at,
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")

    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not credentials:
        return None

    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        return None

    return db.query(User).filter(User.id == user_id).first()


def serialize_history_item(record: AnalysisRecord) -> HistoryItem:
    return HistoryItem(
        id=record.id,
        created_at=record.created_at,
        resume_filename=record.resume_filename,
        job_description=record.job_description,
        job_url=record.job_url,
        parsed_job_data=safe_json_load(record.parsed_job_json, None),
        resume_analysis=json.loads(record.resume_analysis_json),
        job_match=json.loads(record.job_match_json),
        cover_letter=record.cover_letter,
        interview_questions=json.loads(record.interview_questions_json),
    )


def safe_json_load(raw_data: str, fallback):
    try:
        return json.loads(raw_data)
    except (TypeError, ValueError, json.JSONDecodeError):
        return fallback


def _build_user_history_context(db: Session, current_user: Optional[User], limit: int = 5) -> list[dict]:
    if not current_user:
        return []

    records = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.user_id == current_user.id)
        .order_by(AnalysisRecord.created_at.desc())
        .limit(limit)
        .all()
    )

    history_context: list[dict] = []
    for record in records:
        history_context.append(
            {
                "analysis_id": record.id,
                "created_at": record.created_at.isoformat(),
                "resume_filename": record.resume_filename,
                "job_description": record.job_description[:240],
                "resume_analysis": safe_json_load(record.resume_analysis_json, {}),
                "job_match": safe_json_load(record.job_match_json, {}),
            }
        )
    return history_context


def _build_interview_session_cache_key(session_id: str) -> str:
    return f"interview-session:{session_id}"


def _extract_score_breakdown(job_match: dict) -> dict:
    breakdown = job_match.get("score_breakdown", {}) if isinstance(job_match, dict) else {}
    return breakdown if isinstance(breakdown, dict) else {}


def _store_progress_snapshot(db: Session, current_user: Optional[User], analysis_id: Optional[int], job_match: dict) -> None:
    if not current_user or not job_match:
        return

    breakdown = _extract_score_breakdown(job_match)
    matched_skills = job_match.get("matching_skills", []) if isinstance(job_match, dict) else []
    missing_skills = job_match.get("missing_skills", []) if isinstance(job_match, dict) else []

    try:
        create_progress_snapshot(
            db,
            user_id=current_user.id,
            analysis_id=analysis_id,
            ats_score=float(job_match.get("ats_match_score", 0.0) or 0.0),
            semantic_match_percent=float(breakdown.get("semantic_similarity_percent", job_match.get("confidence", 0.0) * 100) or 0.0),
            skill_score=float(breakdown.get("skill_score", 0.0) or 0.0),
            experience_score=float(breakdown.get("experience_score", 0.0) or 0.0),
            project_score=float(breakdown.get("project_score", 0.0) or 0.0),
            education_score=float(breakdown.get("education_score", 0.0) or 0.0),
            matched_skills_json=json.dumps(matched_skills),
            missing_skills_json=json.dumps(missing_skills),
        )
    except Exception as exc:
        logger.warning("Failed to store ATS progress snapshot: %s", exc)


def _hash_analysis_input(resume_text: str, job_description: str, parsed_job_data: dict, parsed_resume_data: dict) -> str:
    payload = {
        "resume_text": resume_text,
        "job_description": job_description,
        "parsed_job_data": parsed_job_data,
        "parsed_resume_data": parsed_resume_data,
    }
    raw = json.dumps(payload, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _check_rate_limit(request: Request, current_user: Optional[User]) -> None:
    key = f"user:{current_user.id}" if current_user else f"ip:{request.client.host if request.client else 'unknown'}"
    now = time.time()
    window_seconds = 60
    max_requests = 20

    bucket = rate_limit_buckets[key]
    while bucket and now - bucket[0] > window_seconds:
        bucket.popleft()

    if len(bucket) >= max_requests:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again shortly.")

    bucket.append(now)


# Startup handler moved to lifespan context manager above


@app.middleware("http")
async def structured_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or generate_request_id()
    request.state.request_id = request_id
    start_ts = time.perf_counter()
    start_time_str = time.strftime('%Y-%m-%dT%H:%M:%S%z')
    try:
        response = await call_next(request)
        status = getattr(response, 'status_code', 500)
    except Exception as exc:
        duration_ms = round((time.perf_counter() - start_ts) * 1000, 2)
        log_json(logging.ERROR,
                 request_id=request_id,
                 method=request.method,
                 path=request.url.path,
                 status=500,
                 duration_ms=duration_ms,
                 timestamp=start_time_str,
                 message=str(exc),
                 error_type=type(exc).__name__)
        raise

    duration_ms = round((time.perf_counter() - start_ts) * 1000, 2)
    log_json(logging.INFO,
             request_id=request_id,
             method=request.method,
             path=request.url.path,
             status=status,
             duration_ms=duration_ms,
             timestamp=start_time_str)
    # Echo request id back to client
    if hasattr(response, 'headers'):
        response.headers['X-Request-ID'] = request_id
    return response


@app.get("/health")
async def health_check():
    """Health check endpoint with DB connectivity check"""
    db_ok = False
    try:
        with database_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception as exc:
        logger.warning("DB health check failed: %s", exc)

    status = "healthy" if db_ok else "degraded"
    return {"status": status, "db": "ok" if db_ok else "error", "service": "AI Resume & Job Coach API"}


@app.post("/job/parse", response_model=JobParseResponse)
async def parse_job(
    request: Request,
    payload: JobParseRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> JobParseResponse:
    try:
        _check_rate_limit(request, current_user)
        parsed = await parse_job_url(payload.url)
        return JobParseResponse(**parsed)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.error("Job parse failed: %s", str(exc), exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to parse job URL")


@app.get("/api/jobs/search", response_model=list[JobSearchItem])
async def search_live_jobs(
    request: Request,
    q: str = Query(..., min_length=2, max_length=120),
    page: int = Query(1, ge=1, le=20),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> list[JobSearchItem]:
    try:
        _check_rate_limit(request, current_user)
        jobs = search_jobs(q, page=page)
        return [JobSearchItem(**item) for item in jobs]
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except requests.HTTPError as exc:
        logger.error("Live job search failed: %s", str(exc), exc_info=True)
        raise HTTPException(status_code=502, detail="Failed to fetch live jobs from JSearch")
    except Exception as exc:
        logger.error("Live job search error: %s", str(exc), exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch live jobs")


@app.post("/auth/register", response_model=AuthResponse)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    existing_user = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        name=payload.name.strip(),
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.email)
    return AuthResponse(access_token=token, user=serialize_user(user))


@app.post("/auth/login", response_model=AuthResponse)
def login_user(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.id, user.email)
    return AuthResponse(access_token=token, user=serialize_user(user))


@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return serialize_user(current_user)


@app.get("/history", response_model=list[HistoryItem])
def list_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[HistoryItem]:
    records = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.user_id == current_user.id)
        .order_by(AnalysisRecord.created_at.desc())
        .limit(50)
        .all()
    )
    return [serialize_history_item(item) for item in records]


@app.delete("/history/{history_id}")
def delete_history_item(
    history_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.id == history_id, AnalysisRecord.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="History item not found")

    db.delete(record)
    db.commit()
    return {"status": "deleted", "id": history_id}


@app.get("/analytics/summary", response_model=AnalyticsSummary)
def get_analytics_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnalyticsSummary:
    records = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.user_id == current_user.id)
        .order_by(AnalysisRecord.created_at.desc())
        .all()
    )

    if not records:
        return AnalyticsSummary(
            total_analyses=0,
            avg_ats_score=0.0,
            best_ats_score=0.0,
            analyses_last_7_days=0,
            top_missing_skills=[],
            ats_progress_timeline=[],
            recent_interview_sessions=[],
        )

    seven_days_ago = datetime.now() - timedelta(days=7)
    analyses_last_7_days = sum(1 for item in records if item.created_at >= seven_days_ago)

    ats_scores: list[float] = []
    missing_skill_counter: dict[str, int] = {}

    for record in records:
        job_match = safe_json_load(record.job_match_json, {})
        score = job_match.get("ats_match_score")
        try:
            ats_scores.append(float(score))
        except (TypeError, ValueError):
            pass

        missing_skills = job_match.get("missing_skills", [])
        if isinstance(missing_skills, list):
            for skill in missing_skills:
                if isinstance(skill, dict):
                    skill_name = str(skill.get("skill", "")).strip()
                else:
                    skill_name = str(skill).strip()
                if skill_name:
                    missing_skill_counter[skill_name] = missing_skill_counter.get(skill_name, 0) + 1

    avg_ats_score = round(sum(ats_scores) / len(ats_scores), 2) if ats_scores else 0.0
    best_ats_score = round(max(ats_scores), 2) if ats_scores else 0.0
    top_missing_skills = [
        skill for skill, _ in sorted(missing_skill_counter.items(), key=lambda item: item[1], reverse=True)[:5]
    ]

    progress_points = [
        ATSProgressPoint(**point)
        for point in get_recent_progress_points(db, current_user.id, limit=12)
    ]
    interview_sessions = [
        InterviewSessionResponse(**session)
        for session in get_recent_interview_sessions(db, current_user.id, limit=8)
    ]

    return AnalyticsSummary(
        total_analyses=len(records),
        avg_ats_score=avg_ats_score,
        best_ats_score=best_ats_score,
        analyses_last_7_days=analyses_last_7_days,
        top_missing_skills=top_missing_skills,
        ats_progress_timeline=progress_points,
        recent_interview_sessions=interview_sessions,
    )


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_resume_and_job(
    request: Request,
    resume: UploadFile = File(..., description="Resume PDF file"),
    job_description: Optional[str] = Form(None, description="Job description text"),
    job_url: Optional[str] = Form(None, description="Job posting URL"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> AnalysisResponse:
    """
    Main analysis endpoint that orchestrates the multi-agent pipeline.
    
    Args:
        resume: PDF file containing the resume
        job_description: String containing the job description
        
    Returns:
        AnalysisResponse containing:
        - resume_analysis: Structured analysis of the resume
        - job_match: ATS matching score and analysis
        - cover_letter: Professional 4-paragraph cover letter
        - interview_questions: 8 interview questions with answers
        
    Raises:
        HTTPException: If file processing or analysis fails
    """
    try:
        _check_rate_limit(request, current_user)

        # Validate inputs
        if not resume:
            raise HTTPException(status_code=400, detail="Resume file is required")
        if (not job_description or len(job_description.strip()) < 50) and not (job_url and job_url.strip()):
            raise HTTPException(
                status_code=400,
                detail="Provide either a job description (min 50 chars) or a valid job URL"
            )

        parsed_job_data: dict = {}
        effective_job_description = (job_description or "").strip()

        if job_url and job_url.strip():
            parsed_job_data = await parse_job_url(job_url.strip())
            if not effective_job_description:
                effective_job_description = parsed_job_data.get("raw_text", "")

        if len(effective_job_description) < 50:
            raise HTTPException(status_code=400, detail="Insufficient job content for analysis")
        
        # Extract text from PDF
        logger.info(f"Processing resume file: {resume.filename}")
        resume_text = await extract_text_from_pdf(resume)
        
        if not resume_text or len(resume_text.strip()) < 100:
            raise HTTPException(
                status_code=400,
                detail="Resume PDF is empty or too short to process"
            )
        
        logger.info(f"Resume text extracted: {len(resume_text)} characters")

        parsed_resume_data = parse_resume_text(resume_text)

        cache_key = f"analysis:{_hash_analysis_input(resume_text, effective_job_description, parsed_job_data, parsed_resume_data)}"
        cached = cache_client.get(cache_key)
        if cached:
            response = AnalysisResponse(
                resume_analysis=cached.get("resume_analysis", {}),
                job_match=cached.get("job_match", {}),
                cover_letter=cached.get("cover_letter", ""),
                interview_questions=cached.get("interview_questions", []),
            )
            if current_user:
                history = AnalysisRecord(
                    user_id=current_user.id,
                    resume_filename=resume.filename or "resume.pdf",
                    resume_text=resume_text,
                    job_description=effective_job_description,
                    job_url=job_url.strip() if job_url else None,
                    parsed_job_json=json.dumps(parsed_job_data) if parsed_job_data else None,
                    resume_analysis_json=json.dumps(response.resume_analysis),
                    job_match_json=json.dumps(response.job_match),
                    cover_letter=response.cover_letter,
                    interview_questions_json=json.dumps(response.interview_questions),
                )
                db.add(history)
                db.commit()
                db.refresh(history)
                response.analysis_id = history.id
                _store_progress_snapshot(db, current_user, history.id, response.job_match)
                # Also save ATS report into the persistent ResumeAnalysis table
                try:
                    ra_payload = ResumeAnalysisCreate(
                        user_id=current_user.id,
                        ats_score=float(response.job_match.get("ats_match_score", 0.0) or 0.0),
                        matched_skills=response.job_match.get("matching_skills", []),
                        missing_skills=response.job_match.get("missing_skills", []),
                        semantic_scores=response.job_match.get("score_breakdown", {}),
                        raw_report=json.dumps({"resume_analysis": response.resume_analysis, "job_match": response.job_match}),
                    )
                    save_resume_analysis(db, ra_payload)
                except Exception:
                    logger.exception("Failed to persist ResumeAnalysis for cached result")
            return response
        
        # Create and run the analysis graph
        logger.info("Starting multi-agent analysis pipeline")
        graph = create_analysis_graph()
        user_history = _build_user_history_context(db, current_user)
        
        # Prepare input for the graph
        analysis_input = {
            "resume_text": resume_text,
            "parsed_resume_data": parsed_resume_data,
            "job_description": effective_job_description,
            "parsed_job_data": parsed_job_data,
            "user_history": user_history,
        }
        
        # Run the graph synchronously
        result = graph.invoke(analysis_input)
        
        logger.info("Analysis pipeline completed successfully")
        
        # Extract and structure the response
        response = AnalysisResponse(
            resume_analysis=result.get("resume_analysis", {}),
            job_match=result.get("job_match", {}),
            cover_letter=result.get("cover_letter", ""),
            interview_questions=result.get("interview_questions", [])
        )

        cache_client.set(
            cache_key,
            {
                "resume_analysis": response.resume_analysis,
                "job_match": response.job_match,
                "resume_data": result.get("resume_data", response.resume_analysis),
                "ats_result": result.get("ats_result", response.job_match),
                "user_history": user_history,
                "cover_letter": response.cover_letter,
                "interview_questions": response.interview_questions,
            },
            ttl_seconds=900,
        )

        if current_user:
            history = AnalysisRecord(
                user_id=current_user.id,
                resume_filename=resume.filename or "resume.pdf",
                resume_text=resume_text,
                job_description=effective_job_description,
                job_url=job_url.strip() if job_url else None,
                parsed_job_json=json.dumps(parsed_job_data) if parsed_job_data else None,
                resume_analysis_json=json.dumps(response.resume_analysis),
                job_match_json=json.dumps(response.job_match),
                cover_letter=response.cover_letter,
                interview_questions_json=json.dumps(response.interview_questions),
            )
            db.add(history)
            db.commit()
            db.refresh(history)
            response.analysis_id = history.id
            _store_progress_snapshot(db, current_user, history.id, response.job_match)
            # Persist ATS report to dedicated ResumeAnalysis table as well
            try:
                ra_payload = ResumeAnalysisCreate(
                    user_id=current_user.id,
                    ats_score=float(response.job_match.get("ats_match_score", 0.0) or 0.0),
                    matched_skills=response.job_match.get("matching_skills", []),
                    missing_skills=response.job_match.get("missing_skills", []),
                    semantic_scores=response.job_match.get("score_breakdown", {}),
                    raw_report=json.dumps({"resume_analysis": response.resume_analysis, "job_match": response.job_match}),
                )
                save_resume_analysis(db, ra_payload)
            except Exception:
                logger.exception("Failed to persist ResumeAnalysis for analysis result")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during analysis: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


@app.get("/export/{analysis_id}")
def export_report(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.id == analysis_id, AnalysisRecord.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Analysis record not found")

    report_data = {
        "user_name": current_user.name,
        "user_email": current_user.email,
        "resume_analysis": safe_json_load(record.resume_analysis_json, {}),
        "job_match": safe_json_load(record.job_match_json, {}),
        "cover_letter": record.cover_letter,
        "interview_questions": safe_json_load(record.interview_questions_json, []),
        "job_description": record.job_description,
        "job_url": record.job_url,
        "parsed_job_data": safe_json_load(record.parsed_job_json, {}),
    }

    pdf_bytes = generate_report_pdf_bytes(report_data)
    filename = f"analysis-report-{analysis_id}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


async def extract_text_from_pdf(file: UploadFile) -> str:
    """
    Extract text content from a PDF file.
    
    Args:
        file: Uploaded PDF file
        
    Returns:
        Extracted text from the PDF
        
    Raises:
        HTTPException: If PDF is invalid or cannot be read
    """
    try:
        # Read file content
        contents = await file.read()
        
        # Validate PDF format
        if not contents.startswith(b'%PDF'):
            raise HTTPException(
                status_code=400,
                detail="Invalid file format. Please upload a valid PDF file."
            )
        
        # Parse PDF
        pdf_file = io.BytesIO(contents)
        pdf_reader = PdfReader(pdf_file)
        
        if len(pdf_reader.pages) == 0:
            raise HTTPException(
                status_code=400,
                detail="PDF file is empty"
            )
        
        # Extract text from all pages
        text_content = ""
        for page_num, page in enumerate(pdf_reader.pages):
            try:
                text_content += page.extract_text()
                text_content += "\n"
            except Exception as e:
                logger.warning(f"Could not extract text from page {page_num}: {str(e)}")
        
        return text_content.strip()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF processing error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to process PDF: {str(e)}"
        )


@app.post("/resume/improve", response_model=ResumeImproveResponse)
async def improve_resume(
    payload: ResumeImproveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ResumeImproveResponse:
    """Generate improved resume based on analysis."""
    record = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.id == payload.analysis_id, AnalysisRecord.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found")

    resume_analysis = safe_json_load(record.resume_analysis_json, {})
    job_match = safe_json_load(record.job_match_json, {})

    analysis_data = {
        "resume_analysis": resume_analysis,
        "job_match": job_match,
        "improvements": job_match.get("improvement_suggestions", []),
    }

    # Use stored resume_text or fallback to job_description if not available
    resume_text_to_improve = record.resume_text or record.job_description
    result = await generate_improved_resume(resume_text_to_improve, payload.analysis_id, analysis_data)

    # Store original resume version if not already stored
    original_version = (
        db.query(ResumeVersion)
        .filter(
            ResumeVersion.analysis_id == payload.analysis_id,
            ResumeVersion.user_id == current_user.id,
            ResumeVersion.version_type == "original",
        )
        .order_by(ResumeVersion.created_at.desc())
        .first()
    )
    if not original_version:
        original_version = ResumeVersion(
            user_id=current_user.id,
            analysis_id=payload.analysis_id,
            version_type="original",
            resume_text=resume_text_to_improve,
            filename=record.resume_filename,
        )
        db.add(original_version)
        db.commit()

    if result.get("improved_text") and result["improved_text"] != record.job_description:
        improved_version = (
            db.query(ResumeVersion)
            .filter(
                ResumeVersion.analysis_id == payload.analysis_id,
                ResumeVersion.user_id == current_user.id,
                ResumeVersion.version_type == "improved",
            )
            .order_by(ResumeVersion.created_at.desc())
            .first()
        )
        if improved_version:
            improved_version.resume_text = result["improved_text"]
            improved_version.filename = f"improved-{record.resume_filename}"
            improved_version.improvement_summary = json.dumps(result.get("changes_summary", []))
            improved_version.confidence_score = result.get("confidence_score", 0.0)
            improved_version.created_at = datetime.now()
        else:
            improved_version = ResumeVersion(
                user_id=current_user.id,
                analysis_id=payload.analysis_id,
                version_type="improved",
                resume_text=result["improved_text"],
                filename=f"improved-{record.resume_filename}",
                improvement_summary=json.dumps(result.get("changes_summary", [])),
                confidence_score=result.get("confidence_score", 0.0),
            )
            db.add(improved_version)
        db.commit()

    return ResumeImproveResponse(**result)


@app.get("/resume/{analysis_id}/diff", response_model=ResumeDiffResponse)
def get_resume_diff(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ResumeDiffResponse:
    """Get diff between original and improved resume."""
    original = (
        db.query(ResumeVersion)
        .filter(
            ResumeVersion.analysis_id == analysis_id,
            ResumeVersion.user_id == current_user.id,
            ResumeVersion.version_type == "original",
        )
        .order_by(ResumeVersion.created_at.desc())
        .first()
    )
    improved = (
        db.query(ResumeVersion)
        .filter(
            ResumeVersion.analysis_id == analysis_id,
            ResumeVersion.user_id == current_user.id,
            ResumeVersion.version_type == "improved",
        )
        .order_by(ResumeVersion.created_at.desc())
        .first()
    )

    if not original or not improved:
        raise HTTPException(status_code=404, detail="Resume versions not found")

    diff = calculate_resume_diff(original.resume_text, improved.resume_text)
    return ResumeDiffResponse(**diff)


@app.post("/jobs", response_model=JobApplicationResponse)
def create_job_application(
    payload: JobApplicationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> JobApplicationResponse:
    """Create a new job application tracker."""
    job = JobApplication(
        user_id=current_user.id,
        company=payload.company,
        role=payload.role,
        status=payload.status,
        job_url=payload.job_url,
        notes=payload.notes,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return JobApplicationResponse(**{k: v for k, v in vars(job).items() if k != "_sa_instance_state"})


@app.get("/jobs", response_model=list[JobApplicationResponse])
def list_job_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    status: Optional[str] = None,
) -> list[JobApplicationResponse]:
    """List all job applications for the user."""
    query = db.query(JobApplication).filter(JobApplication.user_id == current_user.id)
    if status:
        query = query.filter(JobApplication.status == status)
    jobs = query.order_by(JobApplication.applied_date.desc()).all()
    return [JobApplicationResponse(**{k: v for k, v in vars(job).items() if k != "_sa_instance_state"}) for job in jobs]


@app.put("/jobs/{job_id}", response_model=JobApplicationResponse)
def update_job_application(
    job_id: int,
    payload: JobApplicationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> JobApplicationResponse:
    """Update a job application."""
    job = (
        db.query(JobApplication)
        .filter(JobApplication.id == job_id, JobApplication.user_id == current_user.id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job application not found")

    job.company = payload.company
    job.role = payload.role
    job.status = payload.status
    job.job_url = payload.job_url
    job.notes = payload.notes
    job.updated_at = datetime.now()
    db.commit()
    db.refresh(job)
    return JobApplicationResponse(**{k: v for k, v in vars(job).items() if k != "_sa_instance_state"})


@app.delete("/jobs/{job_id}")
def delete_job_application(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a job application."""
    job = (
        db.query(JobApplication)
        .filter(JobApplication.id == job_id, JobApplication.user_id == current_user.id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job application not found")

    db.delete(job)
    db.commit()
    return {"status": "deleted", "id": job_id}


@app.post("/profile", response_model=UserProfileResponse)
def update_user_profile(
    payload: UserProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserProfileResponse:
    """Update or create user profile."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()

    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    profile.experience_level = payload.experience_level
    profile.target_role = payload.target_role
    profile.location = payload.location
    profile.salary_range = payload.salary_range
    profile.language = payload.language
    profile.updated_at = datetime.now()
    db.commit()
    db.refresh(profile)
    return UserProfileResponse(**{k: v for k, v in vars(profile).items() if k != "_sa_instance_state"})


@app.get("/profile", response_model=UserProfileResponse)
def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserProfileResponse:
    """Get user profile."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return UserProfileResponse(**{k: v for k, v in vars(profile).items() if k != "_sa_instance_state"})


@app.post("/email/follow-up", response_model=EmailResponse)
async def generate_followup_email_endpoint(
    payload: FollowUpEmailRequest,
    current_user: User = Depends(get_current_user),
) -> EmailResponse:
    """Generate a professional follow-up email for a job application."""
    result = await generate_follow_up_email(payload.company, payload.role, payload.context or "")
    return EmailResponse(**result)


@app.post("/email/interview", response_model=EmailResponse)
async def generate_interview_email_endpoint(
    company: str = Form(...),
    role: str = Form(...),
    interview_date: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
) -> EmailResponse:
    """Generate a professional interview confirmation email."""
    result = await generate_interview_preparation_email(company, role, interview_date or "")
    return EmailResponse(**result)


@app.post("/interview/analyze", response_model=InterviewAnalysisResponse)
async def analyze_interview_answer_endpoint(
    payload: InterviewAnswerRequest,
    current_user: User = Depends(get_current_user),
) -> InterviewAnalysisResponse:
    """Analyze an interview answer for weak points and red flags."""
    result = await analyze_interview_answer(payload.question, payload.answer)
    return InterviewAnalysisResponse(**result)


@app.post("/interview/session/start", response_model=InterviewSessionStartResponse)
def start_interview_session(
    payload: InterviewSessionStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InterviewSessionStartResponse:
    """Start a voice mock interview session from a saved analysis record."""
    record = (
        db.query(AnalysisRecord)
        .filter(AnalysisRecord.id == payload.analysis_id, AnalysisRecord.user_id == current_user.id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Analysis record not found")

    resume_analysis = safe_json_load(record.resume_analysis_json, {})
    ats_result = safe_json_load(record.job_match_json, {})
    parsed_job_data = safe_json_load(record.parsed_job_json, {})
    user_history = _build_user_history_context(db, current_user)

    session_id = secrets.token_urlsafe(16)
    context = {
        "resume_filename": record.resume_filename,
        "job_description": record.job_description[:500],
        "resume_skills": resume_analysis.get("skills", {}).get("technical", []),
        "ats_gaps": ats_result.get("gaps_to_address", []) or [
            item.get("skill", "") for item in ats_result.get("missing_skills", []) if isinstance(item, dict)
        ],
    }
    questions = generate_interview_questions(resume_analysis, ats_result, user_history, parsed_job_data)
    session_data = {
        "session_id": session_id,
        "analysis_id": record.id,
        "user_id": current_user.id,
        "questions": questions,
        "responses": [],
        "current_index": 0,
        "context": context,
        "user_history": user_history,
    }
    cache_client.set(_build_interview_session_cache_key(session_id), session_data, ttl_seconds=7200)
    create_interview_session(
        db,
        user_id=current_user.id,
        analysis_id=record.id,
        session_token=session_id,
        question_count=len(questions),
        current_index=0,
        status="active",
        context_json=json.dumps({"context": context, "questions": questions, "user_history": user_history}),
    )
    return InterviewSessionStartResponse(session_id=session_id, analysis_id=record.id, questions=questions, context=context)


@app.get("/interview/session/{session_id}", response_model=InterviewSessionStateResponse)
def get_interview_session_state(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InterviewSessionStateResponse:
    """Retrieve the current interview session state."""
    session_data = cache_client.get(_build_interview_session_cache_key(session_id))
    if not session_data or session_data.get("user_id") != current_user.id:
        session_row = (
            db.query(InterviewSession)
            .filter(InterviewSession.session_token == session_id, InterviewSession.user_id == current_user.id)
            .first()
        )
        if not session_row:
            raise HTTPException(status_code=404, detail="Interview session not found")

        parsed_context = safe_json_load(session_row.context_json, {})
        questions = parsed_context.get("questions", []) if isinstance(parsed_context, dict) else []
        context = parsed_context.get("context", {}) if isinstance(parsed_context, dict) else {}
        responses = []
        for attempt in sorted(session_row.attempts, key=lambda item: item.question_index):
            responses.append(
                {
                    "question_index": attempt.question_index,
                    "question": attempt.question_text,
                    "answer": attempt.answer_text,
                    "feedback": safe_json_load(attempt.feedback_json, {}),
                }
            )

        session_data = {
            "session_id": session_row.session_token,
            "analysis_id": session_row.analysis_id,
            "user_id": session_row.user_id,
            "questions": questions,
            "responses": responses,
            "current_index": session_row.current_index,
            "context": context,
            "user_history": parsed_context.get("user_history", []) if isinstance(parsed_context, dict) else [],
        }
        cache_client.set(_build_interview_session_cache_key(session_id), session_data, ttl_seconds=7200)
    return InterviewSessionStateResponse(
        session_id=session_data["session_id"],
        analysis_id=int(session_data["analysis_id"]),
        questions=session_data.get("questions", []),
        responses=session_data.get("responses", []),
        current_index=int(session_data.get("current_index", 0)),
    )


@app.post("/interview/session/evaluate", response_model=InterviewSessionEvaluateResponse)
def evaluate_interview_session_answer(
    payload: InterviewSessionEvaluateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InterviewSessionEvaluateResponse:
    """Evaluate a spoken interview answer and persist feedback in session cache."""
    session_data = cache_client.get(_build_interview_session_cache_key(payload.session_id))
    if not session_data or session_data.get("user_id") != current_user.id:
        raise HTTPException(status_code=404, detail="Interview session not found")

    session_row = (
        db.query(InterviewSession)
        .filter(InterviewSession.session_token == payload.session_id, InterviewSession.user_id == current_user.id)
        .first()
    )
    if not session_row:
        raise HTTPException(status_code=404, detail="Interview session not found")

    questions = session_data.get("questions", [])
    if payload.question_index >= len(questions):
        raise HTTPException(status_code=400, detail="Question index out of range")

    cleaned_answer = normalize_transcript(payload.answer)
    ats_gaps = session_data.get("context", {}).get("ats_gaps", [])
    focus_skills = extract_focus_skills(f"{payload.question} {cleaned_answer}")
    evaluation = evaluate_interview_answer(
        payload.question,
        cleaned_answer,
        {
            "focus_skills": focus_skills,
            "ats_gaps": ats_gaps,
            "resume_filename": session_data.get("context", {}).get("resume_filename", ""),
        },
    )

    # Persist per-question interview attempt in the existing attempts table
    create_interview_attempt(
        db,
        session_id=session_row.id,
        question_index=payload.question_index,
        question_text=payload.question,
        answer_text=cleaned_answer,
        transcript_text=cleaned_answer,
        score_out_of_10=float(evaluation.get("score_out_of_10", 0.0)),
        technical_depth=float(evaluation.get("technical_depth", 0.0)),
        clarity=float(evaluation.get("clarity", 0.0)),
        confidence=float(evaluation.get("confidence", 0.0)),
        communication=float(evaluation.get("communication", 0.0)),
        relevance=float(evaluation.get("relevance", 0.0)),
        strengths_json=json.dumps(evaluation.get("strengths", [])),
        improvements_json=json.dumps(evaluation.get("improvements", [])),
        feedback_json=json.dumps(evaluation),
    )

    # Also save a summarized interview feedback record in the new InterviewSession table
    try:
        fb_payload = SimpleNamespace(
            user_id=current_user.id,
            question=payload.question,
            answer=cleaned_answer,
            feedback=evaluation,
            score=float(evaluation.get("score_out_of_10", 0.0)),
        )
        save_interview_feedback(db, fb_payload)
    except Exception:
        logger.exception("Failed to persist interview feedback")

    responses = session_data.get("responses", [])
    response_item = {
        "question_index": payload.question_index,
        "question": payload.question,
        "answer": cleaned_answer,
        "evaluation": evaluation,
    }
    responses.append(response_item)
    next_index = payload.question_index + 1
    completed = next_index >= len(questions)

    session_data["responses"] = responses
    session_data["current_index"] = next_index
    session_data["last_feedback"] = evaluation
    cache_client.set(_build_interview_session_cache_key(payload.session_id), session_data, ttl_seconds=7200)

    update_interview_session(
        db,
        session_row,
        current_index=next_index,
        status="completed" if completed else "active",
        question_count=len(questions),
        context_json=json.dumps({
            "context": session_data.get("context", {}),
            "questions": questions,
            "user_history": session_data.get("user_history", []),
        }),
    )

    next_question = questions[next_index] if not completed else None
    return InterviewSessionEvaluateResponse(
        session_id=payload.session_id,
        question_index=payload.question_index,
        score_out_of_10=float(evaluation.get("score_out_of_10", 0.0)),
        strengths=list(evaluation.get("strengths", [])),
        improvements=list(evaluation.get("improvements", [])),
        technical_depth=float(evaluation.get("technical_depth", 0.0)),
        clarity=float(evaluation.get("clarity", 0.0)),
        confidence=float(evaluation.get("confidence", 0.0)),
        communication=float(evaluation.get("communication", 0.0)),
        relevance=float(evaluation.get("relevance", 0.0)),
        transcript=cleaned_answer,
        completed=completed,
        next_question=next_question,
    )


@app.get("/task/{task_id}", response_model=TaskResponse)
def get_task_status(
    task_id: str,
    current_user: User = Depends(get_current_user),
) -> TaskResponse:
    """Get the status of a background task."""
    task = get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return TaskResponse(**task.to_dict())


@app.get("/api/history/ats", response_model=list[ResumeAnalysisResponse])
def api_get_ats_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return persisted ATS resume analyses for the current user."""
    records = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.user_id == current_user.id)
        .order_by(ResumeAnalysis.created_at.desc())
        .limit(200)
        .all()
    )
    return records


@app.get("/api/history/interviews", response_model=list[InterviewSessionResponse])
def api_get_interview_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return persisted interview session feedback records for the current user."""
    rows = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == current_user.id)
        .order_by(InterviewSession.created_at.desc())
        .limit(500)
        .all()
    )
    return rows

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
