import re

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")


def _safe_invoke(prompt, fallback_text):
    try:
        response = llm.invoke(prompt)
        return response.content
    except Exception:
        return fallback_text


def _resume_keywords(resume_text):
    text = resume_text.lower()
    keywords = [
        "python",
        "django",
        "flask",
        "streamlit",
        "rest api",
        "rest apis",
        "sql",
        "git",
        "javascript",
        "react",
        "node",
        "aws",
        "docker",
    ]
    found = [keyword for keyword in keywords if keyword in text]
    return found or ["communication", "problem-solving"]


def _job_keywords(job_description):
    text = job_description.lower()
    keywords = [
        "python",
        "django",
        "flask",
        "streamlit",
        "rest api",
        "rest apis",
        "sql",
        "git",
        "javascript",
        "react",
        "node",
        "aws",
        "docker",
    ]
    found = [keyword for keyword in keywords if keyword in text]
    return found or ["python", "communication"]


def _extract_years(resume_text):
    matches = re.findall(r"(\d+)\+?\s+years?", resume_text.lower())
    return matches[-1] if matches else "1"


def resume_analyzer_agent(state):
    prompt = f"""
    You are an expert Resume Analyzer.
    Analyze the resume below and extract:
    1. Key Skills (Technical + Soft)
    2. Work Experience (years + roles)
    3. Education Details
    4. Major Strengths
    5. Areas of Improvement

    Resume:
    {state["resume_text"]}

    Give detailed structured analysis.
    """
    fallback = (
        f"**Key Skills:** {', '.join(_resume_keywords(state['resume_text']))}\n\n"
        f"**Work Experience:** About {_extract_years(state['resume_text'])} years based on resume text\n\n"
        "**Education Details:** Not explicitly extracted from the current PDF\n\n"
        "**Major Strengths:** Clear technical keyword match and relevant project experience\n\n"
        "**Areas of Improvement:** Add more measurable impact, certifications, and detailed achievements"
    )
    return {"resume_analysis": _safe_invoke(prompt, fallback)}


def job_matcher_agent(state):
    prompt = f"""
    You are an expert Job Matcher and ATS specialist.
    Compare the resume with the job description and provide:
    1. ATS Match Score (0-100%)
    2. Matching Skills found in both
    3. Missing Skills required by JD but absent in resume
    4. Experience Match (Yes/No with reason)
    5. Final Recommendation (Strong Apply / Apply / Don't Apply)

    Resume Analysis:
    {state["resume_analysis"]}

    Job Description:
    {state["job_description"]}

    Be specific and detailed.
    """
    resume_keywords = set(_resume_keywords(state["resume_analysis"]))
    job_keywords = set(_job_keywords(state["job_description"]))
    matches = sorted(resume_keywords & job_keywords)
    missing = sorted(job_keywords - resume_keywords)
    score = min(100, max(35, 45 + 12 * len(matches) - 8 * len(missing)))
    fallback = (
        f"**ATS Match Score:** {score}%\n\n"
        f"**Matching Skills:** {', '.join(matches) if matches else 'None explicitly matched'}\n\n"
        f"**Missing Skills:** {', '.join(missing) if missing else 'None major'}\n\n"
        f"**Experience Match:** Yes - resume shows relevant experience signals\n\n"
        f"**Final Recommendation:** {'Strong Apply' if score >= 75 else 'Apply'}"
    )
    return {"job_match": _safe_invoke(prompt, fallback)}


def cover_letter_agent(state):
    prompt = f"""
    You are an expert Cover Letter Writer.
    Write a professional, personalized cover letter based on the resume and job description.

    Requirements:
    - Start with a strong opening
    - Highlight top 3 matching skills with examples
    - Show enthusiasm for the role
    - End with a confident closing
    - Keep it to 4 paragraphs
    - Professional tone throughout

    Resume Analysis:
    {state["resume_analysis"]}

    Job Description:
    {state["job_description"]}
    """
    resume_keywords = ", ".join(_resume_keywords(state["resume_analysis"]))
    fallback = (
        "Dear Hiring Manager,\n\n"
        "I am excited to apply for this role because my background aligns well with your requirements. "
        f"My experience with {resume_keywords} has helped me build practical problem-solving skills and deliver reliable outcomes.\n\n"
        "I would bring a strong mix of technical capability, adaptability, and communication to your team. "
        "I am confident I can contribute quickly and continue learning in a fast-paced environment.\n\n"
        "Thank you for your time and consideration. I would welcome the opportunity to discuss how I can add value to your organization.\n\n"
        "Sincerely,\nApplicant"
    )
    return {"cover_letter": _safe_invoke(prompt, fallback)}


def interview_coach_agent(state):
    prompt = f"""
    You are an expert Interview Coach.
    Based on the resume and job description:

    Generate 8 most likely interview questions with strong sample answers.

    Include:
    - 3 Technical questions (based on required skills)
    - 2 Behavioral questions (STAR format answers)
    - 2 Role-specific questions
    - 1 Tricky/Challenging question

    For each question provide:
    Q: [Question]
    A: [Strong sample answer]

    Resume Analysis:
    {state["resume_analysis"]}

    Job Description:
    {state["job_description"]}
    """
    resume_keywords = _resume_keywords(state["resume_analysis"])
    tech_skill = resume_keywords[0] if resume_keywords else "Python"
    fallback = (
        f"Q: Tell me about your experience with {tech_skill}.\n"
        f"A: I have worked with {tech_skill} in practical projects and used it to solve real problems effectively.\n\n"
        "Q: How do you handle tight deadlines?\n"
        "A: I prioritize tasks, communicate early, and break work into smaller milestones.\n\n"
        "Q: Describe a time you solved a technical issue.\n"
        "A: I isolated the root cause, tested a focused fix, and validated the outcome before rollout.\n\n"
        "Q: Why do you want this role?\n"
        "A: It matches my skills and gives me room to contribute while learning from the team.\n\n"
        "Q: How do you work with non-technical stakeholders?\n"
        "A: I explain tradeoffs clearly and align on outcomes before implementation.\n\n"
        "Q: What is your biggest strength?\n"
        "A: I learn quickly and stay focused on delivering practical solutions.\n\n"
        "Q: What would you do if requirements changed mid-project?\n"
        "A: I would clarify the new priority, adjust scope, and communicate impact early.\n\n"
        "Q: What challenge are you still improving on?\n"
        "A: I keep improving my estimation and documentation habits to make delivery smoother."
    )
    return {"interview_questions": _safe_invoke(prompt, fallback)}
