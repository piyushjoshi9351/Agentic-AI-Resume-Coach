import re
from typing import List, Dict, Any
try:
    import spacy
except ImportError:
    spacy = None
from pypdf import PdfReader

# Try to load spaCy model; user should run: python -m spacy download en_core_web_sm
if spacy:
    try:
        nlp = spacy.load("en_core_web_sm")
    except Exception:
        nlp = None
else:
    nlp = None

DEGREE_PATTERNS = r"\b(Bachelor|B\.Sc|BSc|B\.E|BE|BTech|B\.Tech|Master|M\.Sc|MSc|M\.Tech|MTech|MBA|PhD|Doctor|Associate|BS|MS)\b"
YEARS_PATTERN = r"(19|20)\d{2}"
SKILL_PHRASE_PATTERN = re.compile(r"\b[A-Za-z][A-Za-z0-9+#./-]*(?:\s+[A-Za-z0-9][A-Za-z0-9+#./-]*){0,2}\b")


def _normalize_phrase(phrase: str) -> str:
    phrase = re.sub(r"\s+", " ", phrase).strip(" -,:;|\t\n\r")
    return phrase


def extract_text_from_pdf(path: str) -> str:
    """Extract plain text from a PDF file using pdfplumber."""
    try:
        import pdfplumber

        text = []
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text.append(page_text)
        return "\n".join(text)
    except ImportError:
        reader = PdfReader(path)
        text = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text.append(page_text)
        return "\n".join(text)


def _candidate_skill_phrases(text: str, top_n: int = 80) -> List[str]:
    """Use spaCy to extract noun chunks and entities as candidate skills."""
    candidates: list[str] = []

    if not nlp:
        # fallback: return visible skill-like phrases from the resume text
        tokens = re.findall(r"[A-Za-z][A-Za-z0-9+#./-]{1,}(?:\s+[A-Za-z0-9][A-Za-z0-9+#./-]{1,}){0,2}", text)
        candidates.extend(tokens)
    else:
        doc = nlp(text)
        for chunk in doc.noun_chunks:
            candidates.append(chunk.text)
        for ent in doc.ents:
            candidates.append(ent.text)

    for match in SKILL_PHRASE_PATTERN.finditer(text):
        candidates.append(match.group(0))

    seen = set()
    out = []
    stop_terms = {"experience", "education", "summary", "profile", "skills", "project", "projects"}
    for raw_phrase in candidates:
        phrase = _normalize_phrase(raw_phrase)
        if not phrase:
            continue
        lowered = phrase.lower()
        if lowered in stop_terms:
            continue
        if lowered not in seen and len(phrase) <= 60:
            out.append(phrase)
            seen.add(lowered)
    return out[:top_n]


def extract_education(text: str) -> List[Dict[str, Any]]:
    educations = []
    for m in re.finditer(DEGREE_PATTERNS, text, flags=re.I):
        context = text[max(0, m.start() - 80): m.end() + 80]
        year_match = re.search(YEARS_PATTERN, context)
        educations.append({
            "degree": m.group(0),
            "context": context.strip(),
            "year": year_match.group(0) if year_match else None,
        })
    return educations


def extract_experience(text: str) -> List[Dict[str, Any]]:
    experiences = []
    # Find lines with year ranges or 'Present'
    for line in text.splitlines():
        if re.search(r"(\b(19|20)\d{2}\b).*(-|to).*(\b(19|20)\d{2}\b|Present)", line, flags=re.I) or "Present" in line:
            experiences.append({"line": line.strip()})
    # fallback: use spaCy for ORG and DATE pairs
    if nlp:
        doc = nlp(text)
        cur = {}
        for ent in doc.ents:
            if ent.label_ in ("ORG",):
                cur.setdefault("orgs", []).append(ent.text)
            if ent.label_ in ("DATE",):
                cur.setdefault("dates", []).append(ent.text)
        if cur:
            experiences.append(cur)
    return experiences


def extract_skills(text: str) -> List[str]:
    """Extract a normalized list of skill-like phrases from resume or job text."""
    skills = _candidate_skill_phrases(text)
    return [skill for skill in skills if any(char.isalpha() for char in skill)]


def parse_resume_text(text: str) -> Dict[str, Any]:
    """Parse raw resume text into structured sections."""
    candidates = extract_skills(text)
    education = extract_education(text)
    experience = extract_experience(text)

    skills = []
    for s in candidates:
        s_clean = _normalize_phrase(s)
        if len(s_clean) > 1 and not s_clean.isdigit():
            skills.append(s_clean)

    return {
        "text": text,
        "skills": skills,
        "education": education,
        "experience": experience,
    }


def parse_resume(path: str) -> Dict[str, Any]:
    """High-level resume parser.

    Returns: {
        'text': str,
        'skills': [str],
        'education': [...],
        'experience': [...]
    }
    """
    text = extract_text_from_pdf(path)
    return parse_resume_text(text)
