"""
Multi-Agent System for AI Resume & Job Coach
Uses schema-validated LLM outputs with retry and fallback.
"""

import json
import logging
import os
import re
from .ai_schemas import (
  ResumeAnalysisModel,
  JobMatchModel,
    CoverLetterModel,
  InterviewQuestionsModel,
)
from .ats import compute_ats_score, extract_skills, parse_resume_text
from .services.llm_router import llm_router

logger = logging.getLogger(__name__)

AI_PROVIDER = os.getenv("AI_PROVIDER", "local").lower()


TECH_SKILLS = [
    "python", "django", "fastapi", "flask", "rest api", "rest apis", "sql", "postgresql",
    "mysql", "react", "javascript", "typescript", "streamlit", "pandas", "numpy",
    "scikit-learn", "machine learning", "deep learning", "nlp", "llm", "langchain",
    "langgraph", "docker", "kubernetes", "aws", "git", "html", "css", "api",
]

SOFT_SKILLS = [
    "communication", "teamwork", "leadership", "problem solving", "collaboration",
    "ownership", "agile", "mentoring", "analysis", "presentation", "adaptability",
]

JOB_SKILLS = [
    "python", "django", "fastapi", "flask", "sql", "postgresql", "mysql", "react",
    "javascript", "typescript", "aws", "docker", "llm", "machine learning", "data",
    "nlp", "api", "rest api", "streamlit", "pandas", "numpy",
]

HIGH_PRIORITY_JOB_SKILLS = {
    "python",
    "django",
    "fastapi",
    "sql",
    "postgresql",
    "mysql",
    "react",
    "javascript",
    "typescript",
    "aws",
    "docker",
    "llm",
    "machine learning",
    "nlp",
    "api",
    "rest api",
}

GENERAL_STOPWORDS = {
    "about", "above", "across", "after", "again", "against", "also", "among", "application",
    "applications", "build", "built", "care", "collaborate", "company", "developer", "engineer",
    "experience", "experienced", "including", "looking", "manage", "manage", "required", "role",
    "software", "team", "teams", "years", "year", "strong", "responsibilities", "responsibility",
    "using", "work", "working", "with", "within", "your", "our", "their", "this", "that",
    "for", "from", "and", "the", "to", "of", "in", "on", "as", "by", "is", "are", "be",
}


def _unique_preserve_order(items: list[str]) -> list[str]:
    seen = set()
    ordered = []
    for item in items:
        normalized = _normalize(item)
        if normalized and normalized not in seen:
            ordered.append(item)
            seen.add(normalized)
    return ordered


def _skill_matches_catalog(skill: str, catalog: list[str]) -> bool:
    normalized_skill = _normalize(skill)
    normalized_catalog = [_normalize(item) for item in catalog]
    return any(
        normalized_skill == item
        or normalized_skill in item
        or item in normalized_skill
        for item in normalized_catalog
    )


def _resume_profile_from_state(resume_text: str, parsed_resume_data: dict | None = None) -> dict:
    profile = parsed_resume_data or {}
    if not profile:
        profile = parse_resume_text(resume_text)
    return profile


def _extract_job_skills(job_description: str, parsed_job_data: dict) -> list[str]:
    candidates: list[str] = []
    if isinstance(parsed_job_data.get("skills"), list):
        candidates.extend(str(skill) for skill in parsed_job_data["skills"])
    candidates.extend(extract_skills(job_description))
    return _unique_preserve_order([_normalize(skill) for skill in candidates if skill])


def _extract_candidate_years(resume_text: str, parsed_resume_data: dict | None = None) -> float:
    years = float(_find_years(resume_text))
    if years:
        return years

    profile = parsed_resume_data or {}
    experience_items = profile.get("experience", []) if isinstance(profile, dict) else []
    if isinstance(experience_items, list) and experience_items:
        return float(min(max(len(experience_items), 1), 10))

    return 0.0


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def _find_terms(text: str, terms: list[str]) -> list[str]:
    normalized = _normalize(text)
    found: list[str] = []
    for term in terms:
        if term in normalized and term not in found:
            found.append(term)
    return found


def _find_years(text: str) -> int:
    matches = re.findall(r"(\d+)\+?\s*(?:years?|yrs?)", text.lower())
    return max((int(match) for match in matches), default=0)


def _sentence_snippets(text: str, limit: int = 4) -> list[str]:
    snippets = []
    for raw_line in text.splitlines():
        line = raw_line.strip("-•\t ")
        if not line:
            continue
        if any(word in line.lower() for word in ["built", "developed", "implemented", "improved", "led", "managed", "created", "designed", "worked"]):
            snippets.append(line)
        if len(snippets) >= limit:
            break
    return snippets


def _term_weight(term: str) -> float:
    if term in HIGH_PRIORITY_JOB_SKILLS:
        return 3.0
    if " " in term:
        return 2.0
    return 1.0


def _weighted_skill_coverage(resume_terms: list[str], job_terms: list[str]) -> tuple[float, list[str], list[str]]:
    resume_set = set(resume_terms)
    job_unique: list[str] = []
    for term in job_terms:
        if term not in job_unique:
            job_unique.append(term)

    if not job_unique:
        return 0.0, [], []

    total_weight = sum(_term_weight(term) for term in job_unique)
    matched = [term for term in job_unique if term in resume_set]
    matched_weight = sum(_term_weight(term) for term in matched)
    missing = [term for term in job_unique if term not in resume_set]
    return (matched_weight / total_weight) if total_weight else 0.0, matched, missing


def _experience_fit_score(years_candidate: int, years_required: int) -> float:
    if years_required <= 0:
        return 0.65 if years_candidate > 0 else 0.45
    if years_candidate >= years_required:
        return 1.0
    return max(0.2, years_candidate / years_required)


def _project_signal_score(resume_text: str, resume_analysis: dict) -> float:
    experience_items = resume_analysis.get("experience", []) if isinstance(resume_analysis, dict) else []
    achievement_count = 0
    for item in experience_items:
      if isinstance(item, dict):
        achievement_count += len(item.get("key_achievements", []) or [])

    project_mentions = len(
        re.findall(r"\b(project|projects|built|developed|implemented|shipped|launched|delivered)\b", resume_text.lower())
    )

    score = 35.0 + min(35.0, achievement_count * 8.0) + min(20.0, project_mentions * 4.0)
    if not achievement_count and not project_mentions:
        score = 45.0 if resume_text.strip() else 0.0
    return max(0.0, min(100.0, score))


def _education_signal_score(resume_text: str, resume_analysis: dict) -> float:
    education_items = resume_analysis.get("education", []) if isinstance(resume_analysis, dict) else []
    if isinstance(education_items, list) and education_items:
        return min(100.0, 85.0 + min(15.0, len(education_items) * 5.0))

    normalized_text = resume_text.lower()
    if any(keyword in normalized_text for keyword in ["btech", "b.tech", "bsc", "b.sc", "mtech", "m.tech", "bachelor", "master", "degree"]):
        return 70.0

    return 55.0 if resume_text.strip() else 0.0


def _context_keywords(text: str, limit: int = 12) -> list[str]:
    keywords: list[str] = []
    for raw_word in re.findall(r"[a-zA-Z][a-zA-Z0-9+.#/-]{3,}", text.lower()):
        word = raw_word.strip(".-_/+")
        if not word or word in GENERAL_STOPWORDS:
            continue
        if any(skill == word or skill in word for skill in JOB_SKILLS):
            continue
        if word not in keywords:
            keywords.append(word)
        if len(keywords) >= limit:
            break
    return keywords


def _resume_analysis_local(resume_text: str, parsed_resume_data: dict | None = None) -> dict:
    profile = _resume_profile_from_state(resume_text, parsed_resume_data)
    extracted_skills = profile.get("skills", []) if isinstance(profile, dict) else []
    extracted_skills = _unique_preserve_order([_normalize(skill) for skill in extracted_skills if skill])

    technical = [skill for skill in extracted_skills if _skill_matches_catalog(skill, TECH_SKILLS)]
    soft = [skill for skill in extracted_skills if _skill_matches_catalog(skill, SOFT_SKILLS)]
    languages = []
    if "hindi" in resume_text.lower():
        languages.append("Hindi")
    if "english" in resume_text.lower():
        languages.append("English")

    years = int(_extract_candidate_years(resume_text, profile))
    snippets = _sentence_snippets(resume_text, limit=3)
    key_achievements = snippets or ["Demonstrates hands-on experience and project-based work."]

    experience_item = {
        "job_title": "Relevant Experience",
        "company": "",
        "duration": f"Approx. {years} years" if years else "Not specified",
        "key_achievements": key_achievements,
        "responsibilities": ["Built and supported software features", "Collaborated with teammates to deliver work"],
    }

    education = []
    parsed_education = profile.get("education", []) if isinstance(profile, dict) else []
    for item in parsed_education[:3]:
        if isinstance(item, dict):
            education.append({
                "degree": item.get("degree", ""),
                "field": item.get("field", ""),
                "institution": item.get("institution", ""),
                "graduation_year": item.get("year", ""),
                "gpa": item.get("gpa", ""),
            })
    if not education:
        for keyword in ["btech", "b.tech", "bsc", "b.sc", "mtech", "m.tech", "bachelor", "master", "degree"]:
            if keyword in resume_text.lower():
                education.append({"degree": "Degree mentioned in resume", "field": "", "institution": "", "graduation_year": "", "gpa": ""})
                break

    strengths = [
        {"strength": "Technical stack includes relevant tools for modern software roles.", "evidence": ", ".join(technical[:5]) or "Resume contains technical keywords."},
        {"strength": "Shows practical delivery experience.", "evidence": snippets[0] if snippets else "Project and responsibility statements present."},
    ]

    weaknesses = [
        {"weakness": "Could include more quantified achievements.", "recommendation": "Add metrics such as performance gains, time saved, or user impact."},
        {"weakness": "Could be more tailored to a target role.", "recommendation": "Reorder bullets to emphasize role-specific skills first."},
    ]

    confidence = 0.72 if technical else 0.55
    overall_quality = "Good" if technical else "Needs improvement"

    return {
        "skills": {
            "technical": technical,
            "soft_skills": soft,
            "languages": languages,
        },
        "experience": [experience_item],
        "education": education,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "overall_assessment": {
            "quality_score": overall_quality,
            "professional_presentation": "Clear and structured, but could be more quantified.",
            "key_improvements": [
                "Add impact metrics to achievements.",
                "Tailor keywords to the target job description.",
                "Include a stronger professional summary.",
            ],
            "summary": "Local fallback analysis generated from resume text because remote Gemini is disabled or unavailable.",
            "confidence": confidence,
        },
        "confidence": confidence,
    }


def _job_match_local(
    resume_text: str,
    job_description: str,
    parsed_job_data: dict,
    resume_analysis: dict,
    parsed_resume_data: dict | None = None,
) -> dict:
    from .ats.skill_matcher import match_skills

    parsed_resume_data = parsed_resume_data if isinstance(parsed_resume_data, dict) else {}
    resume_profile = _resume_profile_from_state(resume_text, parsed_resume_data)
    resume_skills = _unique_preserve_order([_normalize(skill) for skill in (resume_profile.get("skills", []) or []) if skill])
    job_terms = _extract_job_skills(job_description, parsed_job_data)
    if not job_terms:
        job_terms = _unique_preserve_order([_normalize(skill) for skill in _find_terms(job_description, JOB_SKILLS)])
    job_context = _context_keywords(job_description)

    matches = match_skills(resume_skills, job_terms)
    years_required = _find_years(job_description)
    years_candidate = int(_extract_candidate_years(resume_text, resume_profile))
    project_score = _project_signal_score(resume_text, resume_analysis)
    education_score = _education_signal_score(resume_text, resume_analysis)
    score_data = compute_ats_score(
        matches,
        len(job_terms),
        experience_years=float(years_candidate) if years_candidate else None,
        experience_target_years=float(years_required) if years_required else None,
        project_score=project_score,
        education_score=education_score,
    )
    score = round(score_data.get("score", 0.0), 2)

    matched_job_terms = _unique_preserve_order([match[1] for match in matches])
    matching = matched_job_terms
    missing = [term for term in job_terms if term not in matched_job_terms]
    context_overlap = len(set(_context_keywords(resume_text)) & set(job_context)) / max(len(job_context), 1)

    if score >= 85:
        match_level = "Strong Match"
    elif score >= 60:
        match_level = "Good Match"
    elif score >= 40:
        match_level = "Moderate Match"
    else:
        match_level = "Weak Match"
    is_fit = years_candidate >= years_required if years_required else True

    matching_skills = [
        {
            "skill": skill,
            "importance": "high" if skill in HIGH_PRIORITY_JOB_SKILLS else "medium",
            "present_in_resume": True,
            "proficiency_evidence": f"Semantic match found for '{skill}' in resume text.",
            "similarity_score": round(next((match[2] for match in matches if match[1] == skill), 0.0), 2),
        }
        for skill in sorted(matching, key=lambda term: (_term_weight(term), term), reverse=True)[:8]
    ]

    missing_skills = [
        {
            "skill": skill,
            "importance": "high" if skill in HIGH_PRIORITY_JOB_SKILLS else "medium",
            "impact": "Could reduce ATS alignment for this role.",
            "recommendation": f"Add evidence of {skill} experience or similar work.",
        }
        for skill in sorted(missing, key=lambda term: (_term_weight(term), term), reverse=True)[:8]
    ]

    suggestions = []
    if missing:
        suggestions.append({
            "area": "Keywords",
            "suggestion": f"Mirror the job keywords more closely: {', '.join(sorted(missing, key=lambda term: (_term_weight(term), term), reverse=True)[:4])}.",
            "confidence": 0.78,
        })
    if job_context and context_overlap < 0.5:
        suggestions.append({
            "area": "Context",
            "suggestion": f"Add more role-specific context from the posting such as {', '.join(job_context[:4])}.",
            "confidence": 0.7,
        })
    if years_required and years_candidate < years_required:
        suggestions.append({
            "area": "Experience",
            "suggestion": f"The role asks for {years_required}+ years; strengthen the resume with seniority signals, ownership, and measurable outcomes.",
            "confidence": 0.72,
        })
    suggestions.append({
        "area": "Impact",
        "suggestion": "Add measurable outcomes to bullets (for example: faster delivery, lower latency, more users supported).",
        "confidence": 0.74,
    })

    return {
        "ats_match_score": score,
        "match_level": match_level,
        "score_breakdown": score_data.get("score_breakdown", {}),
        "matching_skills": matching_skills,
        "missing_skills": missing_skills,
        "experience_analysis": {
            "years_required": f"{years_required}+" if years_required else "Not specified",
            "years_candidate_has": f"{years_candidate}+" if years_candidate else "Not specified",
            "is_fit": is_fit,
            "analysis": "Candidate experience appears aligned with the target role based on the resume and job description." if is_fit else "Candidate may need to show stronger proof of experience for this role.",
        },
        "career_progression_fit": "Looks aligned for a growth-focused role with room to emphasize impact.",
        "recommendation": f"{match_level}: tailor the resume and highlight the semantic matches that are most relevant to the job.",
        "strengths_for_role": sorted(matching, key=lambda term: (_term_weight(term), term), reverse=True)[:5],
        "gaps_to_address": sorted(missing, key=lambda term: (_term_weight(term), term), reverse=True)[:5],
        "improvement_suggestions": suggestions,
        "confidence": float(score_data.get("semantic_match_percent", 0.0)) / 100 if score_data.get("semantic_match_percent") else 0.76,
    }


def _cover_letter_local(resume_text: str, job_description: str, parsed_job_data: dict, job_match: dict) -> str:
    role = parsed_job_data.get("title") or "the role"
    company = parsed_job_data.get("company") or "your company"
    strengths = ", ".join(job_match.get("strengths_for_role", [])[:3]) or ", ".join(_find_terms(resume_text, TECH_SKILLS)[:3]) or "relevant technical experience"
    return (
        f"Dear Hiring Team at {company},\n\n"
        f"I am excited to apply for the {role}. My background includes {strengths}, and I enjoy building practical, reliable solutions that support team goals.\n\n"
        f"In my work, I have contributed to projects involving software delivery, collaboration, and problem-solving. I would bring that same mindset to {company} and to this opportunity.\n\n"
        f"Thank you for your time and consideration. I would welcome the opportunity to discuss how my experience can contribute to the team.\n\n"
        f"Sincerely,\nYour Name"
    )


def _interview_questions_local(
    resume_text: str,
    job_description: str,
    resume_analysis: dict,
    job_match: dict,
    user_history: list | None = None,
) -> list[dict]:
    tech = resume_analysis.get("skills", {}).get("technical", []) or _find_terms(resume_text, TECH_SKILLS)
    top_skill = tech[0] if tech else "Python"
    role_terms = job_match.get("strengths_for_role", []) or _find_terms(job_description, JOB_SKILLS)
    role_focus = role_terms[0] if role_terms else "the role"
    company_context = "the team and its product goals"
    ats_gaps = job_match.get("gaps_to_address", []) or [skill.get("skill") for skill in job_match.get("missing_skills", []) if isinstance(skill, dict)]
    ats_gaps = [gap for gap in ats_gaps if gap]
    history_signals = []
    if isinstance(user_history, list):
        for item in user_history[:3]:
            if isinstance(item, dict):
                history_signals.append(str(item.get("job_title") or item.get("role") or item.get("resume_filename") or "").strip())
    history_hint = history_signals[0] if history_signals else "prior project experience"

    questions = [
        {
            "question_number": 1,
            "type": "technical",
            "question": f"Can you walk me through a project where you used {top_skill} to solve a real problem?",
            "why_asked": "To check hands-on depth with the primary technical skill.",
            "answer_framework": "Start with the problem, explain your role, describe the approach and tools, and finish with the impact.",
            "strong_answer_example": f"I used {top_skill} to build a solution, broke the work into steps, and improved delivery quality through testing and iteration.",
            "key_points_to_cover": ["problem", "your role", "tools", "outcome"],
            "common_mistakes": ["being too vague", "not mentioning outcomes", "listing tools without context"],
            "follow_up_questions": ["What trade-offs did you make?", "How did you measure success?"],
            "tips": "Use metrics if possible and keep the answer concrete.",
        },
        {
            "question_number": 2,
            "type": "technical",
            "question": f"How would you approach designing or improving a {role_focus} workflow?",
            "why_asked": "To test system thinking and role-specific technical judgment.",
            "answer_framework": "Discuss requirements, design choices, implementation, testing, and monitoring.",
            "strong_answer_example": "I would clarify requirements, choose a simple architecture, validate with tests, and iterate based on feedback.",
            "key_points_to_cover": ["requirements", "design", "testing", "iteration"],
            "common_mistakes": ["jumping straight to code", "ignoring validation", "not considering scale"],
            "follow_up_questions": ["How would you handle edge cases?", "What would you monitor after release?"],
            "tips": "Show structured thinking, not just implementation detail.",
        },
        {
            "question_number": 3,
            "type": "technical",
            "question": "How do you debug a bug that only appears in production?",
            "why_asked": "To understand troubleshooting discipline and calm under pressure.",
            "answer_framework": "Explain how you reproduce, inspect logs, isolate variables, and verify the fix.",
            "strong_answer_example": "I gather logs, narrow the scope, identify the root cause, patch safely, and verify with monitoring.",
            "key_points_to_cover": ["logs", "reproduction", "root cause", "verification"],
            "common_mistakes": ["guessing", "blaming users", "skipping verification"],
            "follow_up_questions": ["How do you prevent regressions?", "How do you communicate the incident?"],
            "tips": "Emphasize process and prevention, not just the fix.",
        },
        {
            "question_number": 4,
            "type": "behavioral",
            "question": "Tell me about a time you had to work with ambiguity.",
            "why_asked": "To see how you structure unclear work.",
            "answer_framework": "Use STAR: situation, task, action, result.",
            "strong_answer_example": "I clarified goals with stakeholders, broke the work into milestones, and delivered incrementally.",
            "key_points_to_cover": ["clarified goals", "broke into milestones", "result"],
            "common_mistakes": ["no structure", "too much context", "no result"],
            "follow_up_questions": ["What did you learn?", "What would you do differently?"],
            "tips": "Keep the answer concise and outcome-focused.",
        },
        {
            "question_number": 5,
            "type": "behavioral",
            "question": "Describe a time when you improved a process or workflow.",
            "why_asked": "To evaluate ownership and continuous improvement.",
            "answer_framework": "Explain the inefficiency, your action, and the measurable improvement.",
            "strong_answer_example": "I automated repetitive work and reduced turnaround time while improving consistency.",
            "key_points_to_cover": ["problem", "automation or improvement", "metric"],
            "common_mistakes": ["no metric", "not explaining your role", "too generic"],
            "follow_up_questions": ["How did the team react?", "What was the impact?"],
            "tips": "Include before/after if you can.",
        },
        {
            "question_number": 6,
            "type": "role-specific",
            "question": f"Why are you interested in working on {company_context}?",
            "why_asked": "To check motivation and alignment.",
            "answer_framework": "Connect your skills, the role, and the company mission.",
            "strong_answer_example": f"I’m interested because my skills align with the work and I want to contribute to {company_context}.",
            "key_points_to_cover": ["motivation", "skills fit", "company interest"],
            "common_mistakes": ["generic answer", "only talking about salary", "no company research"],
            "follow_up_questions": ["What do you know about our product?", "How would you add value in the first 90 days?"],
            "tips": "Mention one specific thing you like about the role or company.",
        },
        {
            "question_number": 7,
            "type": "role-specific",
            "question": f"How would you prioritize tasks if you had multiple deadlines for the {role_focus} role?",
            "why_asked": "To see prioritization and communication skills.",
            "answer_framework": "Describe how you assess impact, risk, dependency, and communicate trade-offs.",
            "strong_answer_example": "I would align on priority, sequence the highest-impact work first, and keep stakeholders updated.",
            "key_points_to_cover": ["impact", "dependencies", "communication"],
            "common_mistakes": ["saying yes to everything", "no communication", "no prioritization method"],
            "follow_up_questions": ["How do you handle changing priorities?", "How do you estimate effort?"],
            "tips": "Show that you can balance speed and quality.",
        },
        {
            "question_number": 8,
            "type": "tricky",
            "question": f"Tell me about a time you made a mistake and how you handled it while working on {history_hint}.",
            "why_asked": "To assess accountability and learning.",
            "answer_framework": "Admit the mistake, explain the fix, and share the lesson learned.",
            "strong_answer_example": "I found the issue, communicated early, fixed it, and changed my process to prevent it happening again.",
            "key_points_to_cover": ["ownership", "repair", "lesson learned"],
            "common_mistakes": ["defensiveness", "blaming others", "no lesson learned"],
            "follow_up_questions": ["What would you do differently next time?", "How did you communicate it?"],
            "tips": "Be honest and show maturity.",
        },
    ]

    if ats_gaps:
        for index, gap in enumerate(ats_gaps[:2], start=9):
            questions.append(
                {
                    "question_number": index,
                    "type": "ATS-gap",
                    "question": f"Your ATS result shows a gap in {gap}. How would you close that gap quickly and prove it in practice?",
                    "why_asked": "To test self-awareness and learning velocity against the role's missing skills.",
                    "answer_framework": "Acknowledge the gap, describe how you'd learn it, and explain how you'd demonstrate it through a project or outcome.",
                    "strong_answer_example": f"I would build a focused project around {gap}, document what I learned, and show measurable progress within a short timeline.",
                    "key_points_to_cover": ["acknowledge the gap", "learning plan", "proof of progress"],
                    "common_mistakes": ["deflecting the gap", "no concrete plan", "only giving theory"],
                    "follow_up_questions": [f"What would your 2-week plan look like for {gap}?", "How would you prove progress to a hiring manager?"],
                    "tips": "Use a practical recovery plan, not excuses.",
                }
            )

    return questions


def resume_analyzer_agent(state: dict) -> dict:
    """
    Analyzes the resume and extracts structured information.
    
    Extracts: skills, experience, education, strengths, weaknesses
    
    Args:
        state: Dictionary containing resume_text
        
    Returns:
        Dictionary with resume_analysis key
    """
    logger.info("Starting resume analyzer agent")
    
    resume_text = state.get("resume_text", "")
    parsed_resume_data = state.get("parsed_resume_data", {}) if isinstance(state, dict) else {}
    if not isinstance(parsed_resume_data, dict):
        parsed_resume_data = {}
    
    system_prompt = """You are an expert resume analyst and career coach with 20+ years of experience.
Your task is to provide a comprehensive, structured analysis of the provided resume.

ANALYSIS REQUIREMENTS:
1. Extract all technical and soft skills mentioned
2. Identify work experience with key achievements and responsibilities
3. List educational background and certifications
4. Identify resume strengths (what stands out positively)
5. Identify resume weaknesses and areas for improvement
6. Assess overall resume quality and professional presentation
7. Provide actionable recommendations

RESPONSE FORMAT: strict JSON only."""

    user_message = f"""Please analyze this resume in detail:

{resume_text}

Parsed Resume Data Context:
{json.dumps(parsed_resume_data, indent=2)}

Provide comprehensive structured analysis as JSON."""

    if AI_PROVIDER != "gemini":
        resume_analysis = _resume_analysis_local(resume_text, parsed_resume_data)
        state["resume_analysis"] = resume_analysis
        state["resume_data"] = resume_analysis
        logger.info("Resume analyzer agent completed successfully using local mode")
        return state

    fallback = ResumeAnalysisModel().model_dump()
    try:
        state["resume_analysis"] = llm_router.generate_json(
            schema_model=ResumeAnalysisModel,
            system_prompt=system_prompt,
            user_prompt=user_message,
            fallback_data=fallback,
        )
    except Exception as exc:
        logger.error("Resume analyzer Gemini call failed, using local fallback: %s", exc, exc_info=True)
        state["resume_analysis"] = _resume_analysis_local(resume_text, parsed_resume_data)
    state["resume_data"] = state["resume_analysis"]
    logger.info("Resume analyzer agent completed successfully")
    return state


def job_matcher_agent(state: dict) -> dict:
    """
    Matches resume against job description using ATS criteria.
    
    Calculates: ATS match score, matching skills, missing skills, experience fit
    
    Args:
        state: Dictionary containing resume_text and job_description
        
    Returns:
        Dictionary with job_match key
    """
    logger.info("Starting job matcher agent")
    
    resume_text = state.get("resume_text", "")
    job_description = state.get("job_description", "")
    parsed_job_data = state.get("parsed_job_data", {})
    resume_analysis = state.get("resume_analysis", {})
    parsed_resume_data = state.get("parsed_resume_data", {}) if isinstance(state, dict) else {}
    if not isinstance(parsed_resume_data, dict):
        parsed_resume_data = {}
    
    system_prompt = """You are an ATS (Applicant Tracking System) expert and recruiter with 15+ years of hiring experience.
Your task is to analyze how well a resume matches a job description.

ANALYSIS REQUIREMENTS:
1. Calculate ATS match score (0-100) based on keyword alignment, experience relevance, and skill match
2. Identify which required and nice-to-have skills are present in the resume
3. Identify critical missing skills or experience
4. Assess experience match (years of relevant experience required vs candidate has)
5. Evaluate career progression fit for the role
6. Provide recommendation: Strong Match / Good Match / Moderate Match / Weak Match
7. List specific improvements to strengthen candidacy

RESPONSE FORMAT: strict JSON only."""

    user_message = f"""
RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

Parsed Job Data Context:
{json.dumps(parsed_job_data, indent=2)}

Resume Analysis Context:
{json.dumps(resume_analysis, indent=2)}

Parsed Resume Data Context:
{json.dumps(parsed_resume_data, indent=2)}

Perform a detailed ATS and fit analysis. Return valid JSON only."""

    if AI_PROVIDER != "gemini":
        job_match = _job_match_local(resume_text, job_description, parsed_job_data, resume_analysis, parsed_resume_data)
        state["job_match"] = job_match
        state["ats_result"] = job_match
        logger.info("Job matcher agent completed successfully using local mode")
        return state

    fallback = JobMatchModel().model_dump()
    try:
        state["job_match"] = llm_router.generate_json(
            schema_model=JobMatchModel,
            system_prompt=system_prompt,
            user_prompt=user_message,
            fallback_data=fallback,
        )
    except Exception as exc:
        logger.error("Job matcher Gemini call failed, using local fallback: %s", exc, exc_info=True)
        state["job_match"] = _job_match_local(resume_text, job_description, parsed_job_data, resume_analysis, parsed_resume_data)
    state["ats_result"] = state["job_match"]
    logger.info("Job matcher agent completed successfully")
    return state


def cover_letter_agent(state: dict) -> dict:
    """
    Generates a professional 4-paragraph cover letter.
    
    Args:
        state: Dictionary containing resume_text and job_description
        
    Returns:
        Dictionary with cover_letter key
    """
    logger.info("Starting cover letter agent")
    
    resume_text = state.get("resume_text", "")
    job_description = state.get("job_description", "")
    parsed_job_data = state.get("parsed_job_data", {})
    job_match = state.get("job_match", {})
    ats_result = state.get("ats_result", job_match)
    resume_analysis = state.get("resume_analysis", {})
    user_history = state.get("user_history", []) if isinstance(state, dict) else []
    
    system_prompt = """You are a professional executive resume writer and career coach.
Your task is to write a compelling, personalized cover letter.

COVER LETTER REQUIREMENTS:
1. Professional tone, compelling narrative arc
2. Exactly 4 paragraphs:
   - Paragraph 1: Opening - Express enthusiasm, mention specific role/company, brief hook
   - Paragraph 2: Value Proposition - Highlight top 2-3 relevant achievements and skills matching job
   - Paragraph 3: Cultural Fit & Growth - Show understanding of company, express passion for their mission/values
   - Paragraph 4: Call to Action - Professional closing, expression of eagerness, contact info note
3. Personalized to the specific job and company
4. Show concrete examples and achievements
5. Address key job requirements directly
6. Professional, confident, concise (no more than 300 words total)
7. Use specific skills/experiences mentioned in job description
8. Avoid generic phrases and clichés

OUTPUT: Return JSON with one key: cover_letter."""

    user_message = f"""
RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

Resume Strengths:
{json.dumps(resume_analysis.get("strengths", [])[:3], indent=2)}

Job Match Analysis:
{json.dumps(job_match.get("matching_skills", [])[:5], indent=2)}

Parsed Job Data:
{json.dumps(parsed_job_data, indent=2)}

Write a compelling 4-paragraph cover letter tailored to this specific opportunity."""

    if AI_PROVIDER != "gemini":
        state["cover_letter"] = _cover_letter_local(resume_text, job_description, parsed_job_data, job_match)
        logger.info("Cover letter agent completed successfully using local mode")
        return state

    fallback = {
        "cover_letter": "Thank you for considering my application. I bring relevant skills and motivation for this role."
    }
    try:
        result = llm_router.generate_json(
            schema_model=CoverLetterModel,
            system_prompt=system_prompt,
            user_prompt=user_message,
            fallback_data=fallback,
        )
        state["cover_letter"] = result.get("cover_letter", fallback["cover_letter"])
    except Exception as exc:
        logger.error("Cover letter Gemini call failed, using local fallback: %s", exc, exc_info=True)
        state["cover_letter"] = _cover_letter_local(resume_text, job_description, parsed_job_data, job_match)
    logger.info("Cover letter agent completed successfully")
    return state


def interview_coach_agent(state: dict) -> dict:
    """
    Generates 8 interview questions with comprehensive answers.
    
    Breakdown:
    - 3 Technical questions
    - 2 Behavioral questions (STAR format)
    - 2 Role-specific questions
    - 1 Tricky/Edge-case question
    
    Args:
        state: Dictionary containing resume_text, job_description, and analysis
        
    Returns:
        Dictionary with interview_questions key
    """
    logger.info("Starting interview coach agent")
    
    resume_text = state.get("resume_text", "")
    job_description = state.get("job_description", "")
    parsed_job_data = state.get("parsed_job_data", {})
    job_match = state.get("job_match", {})
    ats_result = state.get("ats_result", job_match)
    resume_analysis = state.get("resume_analysis", {})
    user_history = state.get("user_history", []) if isinstance(state, dict) else []
    
    system_prompt = """You are an expert executive coach and interview preparation specialist.
Your task is to create 8 interview questions tailored to the candidate and role, with comprehensive answer frameworks.

INTERVIEW QUESTIONS BREAKDOWN:
1. 3 Technical Questions - Based on job requirements and candidate's technical background
2. 2 Behavioral Questions - Use STAR format (Situation, Task, Action, Result), draw from resume
3. 2 Role-Specific Questions - About company/industry specific challenges
4. 1 Tricky/Edge-case Question - Tests critical thinking and handling adversity

REQUIREMENTS FOR EACH QUESTION:
- Question must be realistic and likely to be asked in real interviews
- For technical: Include depth indicators about what a strong answer would cover
- For behavioral: Reference specific situations that could come from the resume
- Provide comprehensive answer framework (not just keywords)
- Include strategic tips for how to frame the answer
- Address potential follow-up questions
- Answer should be 2-3 minutes speaking time when read aloud

RESPONSE FORMAT: strict JSON only."""

    user_message = f"""
CANDIDATE RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

Candidate's Technical Skills:
{json.dumps(resume_analysis.get("skills", {}).get("technical", [])[:8], indent=2)}

Job Requirements Summary:
{json.dumps(job_match.get("matching_skills", [])[:5], indent=2)}

ATS Result Context:
{json.dumps(ats_result, indent=2)}

User History Context:
{json.dumps(user_history[:3] if isinstance(user_history, list) else [], indent=2)}

Parsed Job Data:
{json.dumps(parsed_job_data, indent=2)}

Generate 8 interview questions (3 technical, 2 behavioral STAR, 2 role-specific, 1 tricky).
Tailor all questions to this specific candidate and role. Return valid JSON only."""

    if AI_PROVIDER != "gemini":
        state["interview_questions"] = _interview_questions_local(resume_text, job_description, resume_analysis, ats_result, user_history)
        logger.info("Interview coach agent completed successfully using local mode")
        return state

    fallback = InterviewQuestionsModel(interview_questions=[]).model_dump()
    try:
        response_data = llm_router.generate_json(
            schema_model=InterviewQuestionsModel,
            system_prompt=system_prompt,
            user_prompt=user_message,
            fallback_data=fallback,
        )
        interview_questions = response_data.get("interview_questions", [])
    except Exception as exc:
        logger.error("Interview coach Gemini call failed, using local fallback: %s", exc, exc_info=True)
        interview_questions = _interview_questions_local(resume_text, job_description, resume_analysis, ats_result, user_history)

    state["interview_questions"] = interview_questions
    logger.info("Interview coach agent completed successfully")
    return state
