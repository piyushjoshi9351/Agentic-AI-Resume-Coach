import logging
from typing import Any


logger = logging.getLogger(__name__)


def _skill_title(skill: str) -> str:
    normalized = skill.strip()
    if not normalized:
        return "Python"
    return normalized[:1].upper() + normalized[1:]


def _as_skill_list(items: Any) -> list[str]:
    if not isinstance(items, list):
        return []
    results: list[str] = []
    for item in items:
        if isinstance(item, dict):
            value = item.get("skill") or item.get("title") or item.get("name")
        else:
            value = item
        text = str(value or "").strip()
        if text and text not in results:
            results.append(text)
    return results


def build_interview_session_context(
    resume_analysis: dict,
    ats_result: dict,
    user_history: list | None = None,
    parsed_job_data: dict | None = None,
) -> dict:
    resume_skills = _as_skill_list(resume_analysis.get("skills", {}).get("technical", []))
    matching_skills = _as_skill_list(ats_result.get("matching_skills", []))
    missing_skills = _as_skill_list(ats_result.get("missing_skills", []))
    strengths = _as_skill_list(resume_analysis.get("strengths", []))

    history_context = []
    if isinstance(user_history, list):
        for item in user_history[:5]:
            if isinstance(item, dict):
                history_context.append(
                    {
                        "job_title": item.get("job_title") or item.get("role") or "Recent analysis",
                        "score": item.get("ats_match_score") or item.get("score") or item.get("job_match", {}).get("ats_match_score"),
                        "missing": item.get("gaps_to_address") or item.get("missing_skills") or [],
                    }
                )

    return {
        "resume_skills": resume_skills,
        "matching_skills": matching_skills,
        "missing_skills": missing_skills,
        "strengths": strengths,
        "history_context": history_context,
        "parsed_job_data": parsed_job_data or {},
    }


def generate_interview_questions(
    resume_analysis: dict,
    ats_result: dict,
    user_history: list | None = None,
    parsed_job_data: dict | None = None,
) -> list[dict]:
    context = build_interview_session_context(resume_analysis, ats_result, user_history, parsed_job_data)
    resume_skills = context["resume_skills"]
    matching_skills = context["matching_skills"]
    missing_skills = context["missing_skills"]
    job_title = context["parsed_job_data"].get("title") or context["parsed_job_data"].get("role") or "this role"
    company = context["parsed_job_data"].get("company") or "the company"

    top_skill = _skill_title(resume_skills[0] if resume_skills else "Python")
    secondary_skill = _skill_title(resume_skills[1] if len(resume_skills) > 1 else top_skill)
    gap_skill = missing_skills[0] if missing_skills else (matching_skills[0] if matching_skills else top_skill)
    history_hint = context["history_context"][0]["job_title"] if context["history_context"] else "a recent project"

    questions = [
        {
            "question_number": 1,
            "type": "technical",
            "question": f"Walk me through how you used {top_skill} in your ATS or resume workflow.",
            "answer_hint": f"Connect {top_skill} to a concrete workflow, decision, and result.",
        },
        {
            "question_number": 2,
            "type": "technical",
            "question": f"How did you connect {secondary_skill} with LangGraph or backend orchestration in this project?",
            "answer_hint": "Explain architecture, data flow, and why the design was chosen.",
        },
        {
            "question_number": 3,
            "type": "technical",
            "question": f"Explain how you would improve semantic matching for {job_title} using embeddings.",
            "answer_hint": "Show matching logic, thresholds, and how you would tune precision/recall.",
        },
        {
            "question_number": 4,
            "type": "behavioral",
            "question": f"Tell me about a time you had to deliver under pressure while working on {history_hint}.",
            "answer_hint": "Use STAR and highlight ownership and outcome.",
        },
        {
            "question_number": 5,
            "type": "behavioral",
            "question": f"Describe a situation where you improved collaboration across frontend and backend work for {company}.",
            "answer_hint": "Show communication, tradeoffs, and measurable impact.",
        },
        {
            "question_number": 6,
            "type": "role-specific",
            "question": f"Why are you interested in {job_title} at {company}?",
            "answer_hint": "Tie motivation to role fit and product impact.",
        },
        {
            "question_number": 7,
            "type": "role-specific",
            "question": f"If the ATS result shows weak coverage in {gap_skill}, how would you close that gap quickly?",
            "answer_hint": "Describe a practical learning plan and how you would prove it.",
        },
        {
            "question_number": 8,
            "type": "tricky",
            "question": "Tell me about a mistake you made and what you changed afterward.",
            "answer_hint": "Be direct, accountable, and specific about the lesson learned.",
        },
    ]

    if missing_skills:
        questions.append(
            {
                "question_number": 9,
                "type": "ATS-gap",
                "question": f"The ATS system flagged {missing_skills[0]} as a gap. How would you demonstrate competence in it within two weeks?",
                "answer_hint": "Show a fast plan, a small project, and visible proof.",
            }
        )

    if len(missing_skills) > 1:
        questions.append(
            {
                "question_number": 10,
                "type": "ATS-gap",
                "question": f"How would you connect {missing_skills[1]} to the work in {job_title}?",
                "answer_hint": "Bridge the gap to business value and learning velocity.",
            }
        )

    return questions