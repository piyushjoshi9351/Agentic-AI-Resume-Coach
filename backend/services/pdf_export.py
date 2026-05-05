"""Generate analysis report PDF using ReportLab (pure Python, no system dependencies)."""

from __future__ import annotations

from datetime import datetime
from io import BytesIO

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY


def _safe_text(value, default="") -> str:
    """Safely convert value to string."""
    if isinstance(value, str):
        return value.strip() or default
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, list):
        return ", ".join(str(v) for v in value if v)
    return default


def generate_report_pdf_bytes(report_data: dict) -> bytes:
    """Generate a professional PDF report from analysis data using ReportLab."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    # Get default styles and create custom styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=18,
        textColor=colors.HexColor("#1e3a8a"),
        spaceAfter=6,
        alignment=TA_LEFT,
    )
    heading_style = ParagraphStyle(
        "CustomHeading",
        parent=styles["Heading2"],
        fontSize=13,
        textColor=colors.HexColor("#2563eb"),
        spaceAfter=8,
        spaceBefore=12,
    )
    normal_style = ParagraphStyle(
        "CustomNormal",
        parent=styles["Normal"],
        fontSize=10,
        alignment=TA_JUSTIFY,
    )
    meta_style = ParagraphStyle(
        "Meta",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#6b7280"),
    )

    # Build story (list of flowable elements)
    story = []

    # Header
    story.append(Paragraph("AI Resume & Job Coach Report", title_style))
    story.append(Spacer(1, 0.15 * inch))

    # Metadata
    user_name = _safe_text(report_data.get("user_name"), "User")
    user_email = _safe_text(report_data.get("user_email"), "N/A")
    generated_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    story.append(Paragraph(f"Generated: {generated_at}", meta_style))
    story.append(Paragraph(f"User: {user_name} ({user_email})", meta_style))
    story.append(Spacer(1, 0.2 * inch))

    # Resume Feedback Section
    story.append(Paragraph("Resume Feedback", heading_style))
    resume_analysis = report_data.get("resume_analysis", {})
    overall_assessment = resume_analysis.get("overall_assessment", {})
    if overall_assessment:
        summary = _safe_text(overall_assessment.get("summary"), "No summary available.")
        story.append(Paragraph(f"<b>Assessment:</b> {summary}", normal_style))
        quality_score = _safe_text(overall_assessment.get("quality_score"), "N/A")
        story.append(Paragraph(f"<b>Quality Score:</b> {quality_score}/10", normal_style))
    else:
        story.append(Paragraph("No resume feedback available.", normal_style))
    story.append(Spacer(1, 0.15 * inch))

    # ATS Match Section
    story.append(Paragraph("ATS Match Analysis", heading_style))
    job_match = report_data.get("job_match", {})
    ats_score = job_match.get("ats_match_score", 0)
    match_level = _safe_text(job_match.get("match_level"), "Not determined")
    story.append(Paragraph(f"<b>ATS Match Score:</b> {ats_score}%", normal_style))
    story.append(Paragraph(f"<b>Match Level:</b> {match_level}", normal_style))
    if job_match.get("recommendation"):
        story.append(Paragraph(f"<b>Recommendation:</b> {job_match['recommendation']}", normal_style))
    story.append(Spacer(1, 0.15 * inch))

    # Missing Skills Section
    story.append(Paragraph("Missing Skills", heading_style))
    missing_skills = job_match.get("missing_skills", [])
    if missing_skills:
        skill_list = []
        for skill_item in missing_skills[:10]:
            if isinstance(skill_item, dict):
                skill = _safe_text(skill_item.get("skill"), "Unknown skill")
                importance = _safe_text(skill_item.get("importance"), "")
            else:
                skill = _safe_text(skill_item, "Unknown skill")
                importance = ""
            label = f"{skill} ({importance})" if importance else skill
            skill_list.append(f"• {label}")
        story.append(Paragraph("<br/>".join(skill_list), normal_style))
    else:
        story.append(Paragraph("No significant missing skills identified.", normal_style))
    story.append(Spacer(1, 0.15 * inch))

    # Improvement Suggestions Section
    story.append(Paragraph("Improvement Suggestions", heading_style))
    improvement_suggestions = job_match.get("improvement_suggestions", [])
    if improvement_suggestions:
        suggestion_list = []
        for sugg_item in improvement_suggestions[:8]:
            if isinstance(sugg_item, dict):
                suggestion = _safe_text(sugg_item.get("suggestion", sugg_item.get("area", "")), "")
            else:
                suggestion = _safe_text(sugg_item, "")
            if suggestion:
                suggestion_list.append(f"• {suggestion}")
        if suggestion_list:
            story.append(Paragraph("<br/>".join(suggestion_list), normal_style))
        else:
            story.append(Paragraph("No suggestions available.", normal_style))
    else:
        story.append(Paragraph("No suggestions available.", normal_style))
    story.append(Spacer(1, 0.15 * inch))

    # Interview Preparation Section
    story.append(PageBreak())
    story.append(Paragraph("Interview Preparation", heading_style))
    interview_questions = report_data.get("interview_questions", [])
    if interview_questions:
        for idx, q_item in enumerate(interview_questions[:6], 1):
            if isinstance(q_item, dict):
                question = _safe_text(q_item.get("question"), "")
                q_type = _safe_text(q_item.get("type"), "")
            else:
                question = _safe_text(q_item, "")
                q_type = ""

            if question:
                label = f"Q{idx} ({q_type}):" if q_type else f"Q{idx}:"
                story.append(Paragraph(f"<b>{label}</b> {question}", normal_style))
                story.append(Spacer(1, 0.1 * inch))
    else:
        story.append(Paragraph("No interview questions available.", normal_style))

    story.append(Spacer(1, 0.3 * inch))
    story.append(Paragraph("Good luck with your interview preparation!", meta_style))

    # Cover Letter Section
    cover_letter = report_data.get("cover_letter", "")
    if cover_letter:
        story.append(PageBreak())
        story.append(Paragraph("Personalized Cover Letter", heading_style))
        # Wrap cover letter text for better formatting
        cover_letter_text = cover_letter.replace("\n", "<br/>")
        story.append(Paragraph(cover_letter_text, normal_style))
        story.append(Spacer(1, 0.2 * inch))

    # Recruiter Summary Section
    story.append(Spacer(1, 0.3 * inch))
    story.append(Paragraph("Recruiter Summary", heading_style))
    job_match = report_data.get("job_match", {})
    ats_score = job_match.get("ats_match_score", 0)
    match_level = _safe_text(job_match.get("match_level"), "Not determined")
    skills = resume_analysis.get("skills", {})
    technical_skills = skills.get("technical", [])

    summary_text = f"""
<b>Candidate Profile:</b> {len(technical_skills)} technical skills, ATS Score: {ats_score}%<br/>
<b>Fit Assessment:</b> {match_level} match for the position<br/>
<b>Key Strengths:</b> {", ".join(job_match.get("strengths_for_role", [])[:3]) or "Diverse background"}<br/>
<b>Ready to proceed:</b> Candidate is {"ready for next round" if ats_score >= 70 else "recommended for further discussion"}<br/>
"""
    story.append(Paragraph(summary_text, normal_style))

    # Build PDF
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()

    return pdf_bytes
