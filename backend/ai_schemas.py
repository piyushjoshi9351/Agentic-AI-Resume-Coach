"""Pydantic schemas for strict AI output validation."""

from pydantic import BaseModel, Field


class ResumeSkillSet(BaseModel):
    technical: list[str] = Field(default_factory=list)
    soft_skills: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)


class ResumeExperienceItem(BaseModel):
    job_title: str = ""
    company: str = ""
    duration: str = ""
    key_achievements: list[str] = Field(default_factory=list)
    responsibilities: list[str] = Field(default_factory=list)


class ResumeEducationItem(BaseModel):
    degree: str = ""
    field: str = ""
    institution: str = ""
    graduation_year: str = ""
    gpa: str = ""


class ResumeStrengthItem(BaseModel):
    strength: str = ""
    evidence: str = ""


class ResumeWeaknessItem(BaseModel):
    weakness: str = ""
    recommendation: str = ""


class ResumeOverallAssessment(BaseModel):
    quality_score: str = ""
    professional_presentation: str = ""
    key_improvements: list[str] = Field(default_factory=list)
    summary: str = ""
    confidence: float = Field(default=0.7, ge=0.0, le=1.0)


class ResumeAnalysisModel(BaseModel):
    skills: ResumeSkillSet = Field(default_factory=ResumeSkillSet)
    experience: list[ResumeExperienceItem] = Field(default_factory=list)
    education: list[ResumeEducationItem] = Field(default_factory=list)
    strengths: list[ResumeStrengthItem] = Field(default_factory=list)
    weaknesses: list[ResumeWeaknessItem] = Field(default_factory=list)
    overall_assessment: ResumeOverallAssessment = Field(default_factory=ResumeOverallAssessment)
    confidence: float = Field(default=0.75, ge=0.0, le=1.0)


class JobMatchSkillItem(BaseModel):
    skill: str = ""
    importance: str = ""
    present_in_resume: bool = False
    proficiency_evidence: str = ""
    similarity_score: float = 0.0


class JobMissingSkillItem(BaseModel):
    skill: str = ""
    importance: str = ""
    impact: str = ""
    recommendation: str = ""


class JobExperienceAnalysis(BaseModel):
    years_required: str = ""
    years_candidate_has: str = ""
    is_fit: bool = False
    analysis: str = ""


class JobImprovementSuggestion(BaseModel):
    area: str = ""
    suggestion: str = ""
    confidence: float = Field(default=0.7, ge=0.0, le=1.0)


class ATSScoreBreakdown(BaseModel):
    skill_score: float = 0.0
    experience_score: float = 0.0
    project_score: float = 0.0
    education_score: float = 0.0
    semantic_similarity_percent: float = 0.0
    coverage_percent: float = 0.0
    weights: dict[str, float] = Field(default_factory=dict)
    weighted_contributions: dict[str, float] = Field(default_factory=dict)
    final_score: float = 0.0


class JobMatchModel(BaseModel):
    ats_match_score: float = 0.0
    match_level: str = ""
    matching_skills: list[JobMatchSkillItem] = Field(default_factory=list)
    missing_skills: list[JobMissingSkillItem] = Field(default_factory=list)
    score_breakdown: ATSScoreBreakdown = Field(default_factory=ATSScoreBreakdown)
    experience_analysis: JobExperienceAnalysis = Field(default_factory=JobExperienceAnalysis)
    career_progression_fit: str = ""
    recommendation: str = ""
    strengths_for_role: list[str] = Field(default_factory=list)
    gaps_to_address: list[str] = Field(default_factory=list)
    improvement_suggestions: list[JobImprovementSuggestion] = Field(default_factory=list)
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)


class InterviewQuestionItem(BaseModel):
    question_number: int = 0
    type: str = ""
    question: str = ""
    why_asked: str = ""
    answer_framework: str = ""
    strong_answer_example: str = ""
    key_points_to_cover: list[str] = Field(default_factory=list)
    common_mistakes: list[str] = Field(default_factory=list)
    follow_up_questions: list[str] = Field(default_factory=list)
    tips: str = ""


class InterviewQuestionsModel(BaseModel):
    interview_questions: list[InterviewQuestionItem] = Field(default_factory=list)


class CoverLetterModel(BaseModel):
    cover_letter: str = ""


class ParsedJobModel(BaseModel):
    title: str = ""
    company: str = ""
    location: str = ""
    skills: list[str] = Field(default_factory=list)
    responsibilities: list[str] = Field(default_factory=list)
    experience_level: str = ""
    raw_text: str = ""
