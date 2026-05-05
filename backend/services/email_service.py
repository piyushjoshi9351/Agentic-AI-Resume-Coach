"""AI-powered email generation for job application follow-ups."""

from __future__ import annotations

import json

from services.llm_router import llm_router


def _fallback_follow_up_email(company: str, role: str, context: str) -> dict:
    body = (
        f"Dear Hiring Team at {company},\n\n"
        f"I hope you're doing well. I wanted to follow up on my application for the {role} role. "
        f"I remain very interested in the opportunity and believe my background aligns well with the team's needs."
    )
    if context:
        body += f"\n\nContext: {context.strip()}"
    body += (
        "\n\nThank you for your time and consideration. I look forward to hearing about next steps.\n\n"
        "Best regards,\nYour Name"
    )
    return {
        "success": True,
        "email_body": body,
        "subject_line": f"Following Up on {role} Position at {company}",
        "confidence": 0.65,
    }


def _fallback_interview_email(company: str, role: str, interview_date: str) -> dict:
    body = (
        f"Dear Hiring Team at {company},\n\n"
        f"Thank you for scheduling the interview for the {role} position. "
        f"I am excited about the opportunity and look forward to speaking with the team."
    )
    if interview_date:
        body += f"\n\nInterview Date: {interview_date}"
    body += (
        "\n\nPlease let me know if there is anything specific I should prepare in advance.\n\n"
        "Best regards,\nYour Name"
    )
    return {
        "success": True,
        "email_body": body,
        "subject_line": f"Confirming Interview - {role} at {company}",
        "confidence": 0.7,
    }


async def generate_follow_up_email(
    company: str,
    role: str,
    context: str = "",
) -> dict:
    """Generate a professional follow-up email."""
    system_prompt = """You are an expert at writing professional follow-up emails for job applications.
Generate a concise, professional 2-3 paragraph follow-up email that:
- Shows genuine interest in the role and company
- Briefly reinforces key qualifications
- Maintains professional tone
- Asks for next steps

Return ONLY the email body (no subject line, no greeting/closing with name)."""

    user_prompt = f"""Generate a professional follow-up email for:
Company: {company}
Role: {role}
Context: {context if context else "General follow-up after application"}

Make it warm, professional, and concise."""

    try:
        email_body = llm_router.generate_text(system_prompt, user_prompt, timeout_seconds=30)
        if not email_body.strip():
            return _fallback_follow_up_email(company, role, context)

        return {
            "success": True,
            "email_body": email_body,
            "subject_line": f"Following Up on {role} Position at {company}",
            "confidence": 0.85,
        }
    except Exception as e:
        fallback = _fallback_follow_up_email(company, role, context)
        fallback["error"] = str(e)
        return fallback


async def generate_interview_preparation_email(
    company: str,
    role: str,
    interview_date: str = "",
) -> dict:
    """Generate a confirmation email before an interview."""
    system_prompt = """Write a professional email confirming attendance for an interview.
The email should:
- Confirm excitement about the interview
- Restate the position and date
- Ask about interview format
- Offer availability flexibility

Return ONLY the email body."""

    user_prompt = f"""Generate an interview confirmation email for:
Company: {company}
Role: {role}
Interview Date: {interview_date if interview_date else "To be confirmed"}"""

    try:
        email_body = llm_router.generate_text(system_prompt, user_prompt, timeout_seconds=30)
        if not email_body.strip():
            return _fallback_interview_email(company, role, interview_date)

        return {
            "success": True,
            "email_body": email_body,
            "subject_line": f"Confirming Interview - {role} at {company}",
            "confidence": 0.90,
        }
    except Exception as e:
        fallback = _fallback_interview_email(company, role, interview_date)
        fallback["error"] = str(e)
        return fallback
