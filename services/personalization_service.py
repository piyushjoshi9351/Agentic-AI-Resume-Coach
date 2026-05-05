"""Prompt personalization based on user profile and context."""

from __future__ import annotations


def personalize_agent_prompt(
    base_prompt: str,
    experience_level: str | None = None,
    target_role: str | None = None,
    language: str = "en",
) -> str:
    """Personalize an AI agent prompt based on user profile."""
    personalization_notes = []

    if experience_level:
        level_guidance = {
            "fresher": "This is a fresher/entry-level candidate. Focus on potential, learning ability, and foundational skills.",
            "mid": "This is a mid-level professional with 3-7 years experience. Focus on impact, leadership potential, and specialized skills.",
            "senior": "This is a senior professional with 7+ years experience. Focus on strategic impact, mentorship, and technical depth.",
        }
        if experience_level.lower() in level_guidance:
            personalization_notes.append(f"CANDIDATE LEVEL: {level_guidance[experience_level.lower()]}")

    if target_role:
        personalization_notes.append(f"TARGET ROLE: {target_role}")
        personalization_notes.append("Tailor analysis and suggestions specifically for this role.")

    if language and language != "en":
        personalization_notes.append(f"Consider local market context for {language}.")

    if personalization_notes:
        return f"{base_prompt}\n\nPERSONALIZATION CONTEXT:\n" + "\n".join(personalization_notes)

    return base_prompt


def get_language_strings(language: str = "en") -> dict:
    """Get language-specific strings for UI and prompts."""
    if language == "hi":
        return {
            "greeting": "नमस्ते",
            "interview_prep": "साक्षात्कार की तैयारी",
            "feedback": "प्रतिक्रिया",
            "skills": "कौशल",
            "experience": "अनुभव",
            "education": "शिक्षा",
        }
    return {
        "greeting": "Hello",
        "interview_prep": "Interview Preparation",
        "feedback": "Feedback",
        "skills": "Skills",
        "experience": "Experience",
        "education": "Education",
    }
