from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional, Any, List


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str]


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ResumeAnalysisCreate(BaseModel):
    user_id: int
    ats_score: Optional[float]
    matched_skills: Optional[Any]
    missing_skills: Optional[Any]
    semantic_scores: Optional[Any]
    raw_report: Optional[str]


class ResumeAnalysisResponse(ResumeAnalysisCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class InterviewSessionCreate(BaseModel):
    user_id: int
    question: str
    answer: Optional[str]
    feedback: Optional[Any]
    score: Optional[float]


class InterviewSessionResponse(InterviewSessionCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
from datetime import datetime

from pydantic import BaseModel, Field


class ATSProgressPoint(BaseModel):
    created_at: datetime
    ats_score: float
    semantic_match_percent: float
    skill_score: float
    experience_score: float
    project_score: float
    education_score: float


class TimelineResponse(BaseModel):
    points: list[ATSProgressPoint] = Field(default_factory=list)


class InterviewSessionCreate(BaseModel):
    user_id: int
    analysis_id: int | None = None
    session_token: str
    question_count: int = 0
    context_json: str = "{}"


class InterviewSessionResponse(BaseModel):
    id: int
    user_id: int
    analysis_id: int | None = None
    session_token: str
    question_count: int
    current_index: int
    status: str
    context_json: str
    created_at: datetime
    updated_at: datetime


class InterviewAttemptCreate(BaseModel):
    session_id: int
    question_index: int
    question_text: str
    answer_text: str
    transcript_text: str | None = None
    score_out_of_10: float = 0.0
    technical_depth: float = 0.0
    clarity: float = 0.0
    confidence: float = 0.0
    communication: float = 0.0
    relevance: float = 0.0
    strengths_json: str = "[]"
    improvements_json: str = "[]"
    feedback_json: str = "{}"


class InterviewAttemptResponse(BaseModel):
    id: int
    session_id: int
    question_index: int
    question_text: str
    answer_text: str
    transcript_text: str | None = None
    score_out_of_10: float
    technical_depth: float
    clarity: float
    confidence: float
    communication: float
    relevance: float
    strengths_json: str
    improvements_json: str
    feedback_json: str
    created_at: datetime
