"""Interview answer analysis for identifying weak responses and red flags."""

from __future__ import annotations

import json

from services.llm_router import llm_router


def _fallback_analysis(question: str, answer: str, error: str | None = None) -> dict:
    answer_lower = answer.lower()
    issues = []
    improvements = []

    if len(answer.split()) < 40:
        issues.append("Answer is too brief and may lack enough detail")
        improvements.append("Expand the answer with more context, actions, and outcomes")

    if not any(word in answer_lower for word in ["led", "built", "improved", "reduced", "increased", "delivered"]):
        issues.append("Answer does not include strong action verbs or measurable impact")
        improvements.append("Use action verbs and quantify results where possible")

    if not any(word in answer_lower for word in ["because", "so that", "which resulted", "leading to"]):
        issues.append("Answer may not clearly connect actions to outcomes")
        improvements.append("Explain the outcome of your actions and why they mattered")

    if not issues:
        issues.append("Answer is decent but could be more specific")
        improvements.append("Add concrete examples and measurable outcomes")

    return {
        "success": True,
        "has_issues": True,
        "issues": issues[:5],
        "improvements": improvements[:5],
        "strength_score": max(20, 85 - len(issues) * 15),
        "confidence": 0.6,
        **({"error": error} if error else {}),
    }


async def analyze_interview_answer(
    question: str,
    answer: str,
) -> dict:
    """Analyze an interview answer for potential red flags."""
    system_prompt = """You are an expert interview coach. Analyze the provided interview answer for:
1. Lack of specificity or metrics
2. Vague language or unclear statements
3. Missing STAR framework (for behavioral questions)
4. Weak structure or poor articulation
5. Overconfidence or underconfidence

Return JSON with:
{
  "has_issues": boolean,
  "issues": ["issue1", "issue2"],
  "improvements": ["improvement1", "improvement2"],
  "strength_score": 0-100,
  "confidence": 0-1.0
}"""

    user_prompt = f"""Analyze this interview answer:

Question: {question}

Answer: {answer}

Provide detailed analysis in JSON format."""

    try:
        response_text = llm_router.generate_text(system_prompt, user_prompt, timeout_seconds=30)

        # Parse JSON response
        import re

        json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            return {
                "success": True,
                "has_issues": result.get("has_issues", False),
                "issues": result.get("issues", []),
                "improvements": result.get("improvements", []),
                "strength_score": result.get("strength_score", 50),
                "confidence": result.get("confidence", 0.7),
            }
        else:
            return _fallback_analysis(question, answer, "Could not parse response")
    except Exception as e:
        return _fallback_analysis(question, answer, str(e))
