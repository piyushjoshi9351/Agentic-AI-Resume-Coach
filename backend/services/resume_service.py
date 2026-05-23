"""Resume versioning, comparison, and improvement service."""

from __future__ import annotations

import difflib
import json
from typing import Any

from .llm_router import llm_router


def calculate_resume_diff(original: str, improved: str) -> dict:
    """Compare two resume versions and return differences."""
    orig_lines = original.split("\n")
    impr_lines = improved.split("\n")

    differ = difflib.Differ()
    diff_lines = list(differ.compare(orig_lines, impr_lines))

    added: list[str] = []
    removed: list[str] = []

    for line in diff_lines:
        if line.startswith("+ "):
            content = line[2:].strip()
            if content:
                added.append(content)
        elif line.startswith("- "):
            content = line[2:].strip()
            if content:
                removed.append(content)

    return {
        "added": added[:20],
        "removed": removed[:20],
        "improved_sections": _detect_sections(original, improved),
    }


def _detect_sections(original: str, improved: str) -> list[str]:
    """Detect which resume sections were improved."""
    sections = ["Skills", "Experience", "Education", "Summary", "Projects", "Certifications"]
    improved_sections = []

    for section in sections:
        orig_section = _extract_section(original, section)
        impr_section = _extract_section(improved, section)
        if orig_section != impr_section and impr_section:
            improved_sections.append(section)

    return improved_sections


def _extract_section(text: str, section_name: str) -> str:
    """Extract section content from resume."""
    lines = text.split("\n")
    in_section = False
    section_lines = []

    for line in lines:
        if section_name.lower() in line.lower() and any(c.isalpha() for c in line):
            in_section = True
            continue
        if in_section:
            if line.strip() and not line[0].isspace() and any(c.isalpha() for c in line):
                break
            if line.strip():
                section_lines.append(line.strip())

    return "\n".join(section_lines)


def _build_fallback_improved_resume(resume_text: str, analysis_data: dict) -> str:
    """Create a deterministic improved resume when the LLM is unavailable."""
    lines = [line.strip() for line in resume_text.splitlines() if line.strip()]
    if not lines:
        return "Professional Summary\nResults-driven professional with relevant technical experience."

    header = lines[:2]
    body = lines[2:]

    strengths = analysis_data.get("resume_analysis", {}).get("strengths", [])
    suggestions = analysis_data.get("job_match", {}).get("improvement_suggestions", [])

    improved_lines = list(header)
    improved_lines.append("Professional Summary: Results-driven professional with experience in building reliable, user-focused software solutions.")
    improved_lines.append("")
    improved_lines.append("Key Strengths:")

    strength_texts = []
    for item in strengths[:3]:
        if isinstance(item, dict):
            strength_texts.append(item.get("strength", ""))
        else:
            strength_texts.append(str(item))

    if strength_texts:
        for strength in strength_texts:
            if strength:
                improved_lines.append(f"- {strength}")
    else:
        improved_lines.append("- Strong technical foundation and adaptable problem-solving ability")

    improved_lines.append("")
    improved_lines.append("Experience Highlights:")
    for line in body[:6]:
        if any(keyword in line.lower() for keyword in ["built", "improved", "developed", "implemented", "led", "delivered"]):
            improved_lines.append(f"- {line.lstrip('- ').strip()}")

    if not any(line.startswith("-") for line in improved_lines[-5:]):
        improved_lines.append("- Built and maintained backend services with a focus on reliability and performance")
        improved_lines.append("- Improved application workflows and collaborated with cross-functional teams")

    if suggestions:
        improved_lines.append("")
        improved_lines.append("ATS Improvements:")
        for suggestion in suggestions[:3]:
            if isinstance(suggestion, dict):
                suggestion_text = suggestion.get("suggestion") or suggestion.get("improvement") or ""
            else:
                suggestion_text = str(suggestion)
            if suggestion_text:
                improved_lines.append(f"- {suggestion_text}")

    return "\n".join(improved_lines)


async def generate_improved_resume(
    resume_text: str,
    analysis_id: int,
    analysis_data: dict,
) -> dict:
    """Generate an improved version of the resume based on analysis."""
    system_prompt = """You are an expert resume writer. Based on the provided resume analysis, 
generate an improved version of the resume that addresses the identified weaknesses and incorporates AI suggestions. 
Return ONLY the improved resume text with no commentary or metadata."""

    user_prompt = f"""
Original Resume:
{resume_text}

Analysis Summary:
{json.dumps(analysis_data, indent=2)}

Generate an improved resume incorporating the analysis suggestions. Make the resume:
- More impactful with quantified achievements
- Better formatted and structured
- Aligned with identified skill gaps
- More ATS-friendly

Return ONLY the improved resume text."""

    try:
        improved_text = llm_router.generate_text(system_prompt, user_prompt, timeout_seconds=60)
        if not improved_text.strip() or improved_text.strip() == resume_text.strip():
            improved_text = _build_fallback_improved_resume(resume_text, analysis_data)

        # Calculate confidence based on analysis quality
        confidence_score = min(
            0.95,
            0.5 + (len(analysis_data.get("strengths", [])) * 0.1),
        )

        # Generate summary of changes
        diff = calculate_resume_diff(resume_text, improved_text)

        return {
            "improved_text": improved_text,
            "confidence_score": round(confidence_score, 2),
            "changes_summary": diff.get("improved_sections", []),
            "added_highlights": diff.get("added", [])[:5],
            "removed_items": diff.get("removed", [])[:5],
        }
    except Exception as e:
        improved_text = _build_fallback_improved_resume(resume_text, analysis_data)
        diff = calculate_resume_diff(resume_text, improved_text)
        return {
            "improved_text": improved_text,
            "confidence_score": 0.35,
            "changes_summary": diff.get("improved_sections", []),
            "added_highlights": diff.get("added", [])[:5],
            "removed_items": diff.get("removed", [])[:5],
            "error": str(e),
        }
