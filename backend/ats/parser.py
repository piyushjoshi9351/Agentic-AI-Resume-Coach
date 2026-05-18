import re
from typing import List, Dict, Any
import pdfplumber
import spacy

# Try to load spaCy model; user should run: python -m spacy download en_core_web_sm
try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    nlp = None

DEGREE_PATTERNS = r"\b(Bachelor|B\.Sc|BSc|Master|M\.Sc|MSc|MBA|PhD|Doctor|Associate)\b"
YEARS_PATTERN = r"(19|20)\d{2}"


def extract_text_from_pdf(path: str) -> str:
    """Extract plain text from a PDF file using pdfplumber."""
    text = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text.append(page_text)
    return "\n".join(text)


def _candidate_skill_phrases(text: str, top_n: int = 80) -> List[str]:
    """Use spaCy to extract noun chunks and entities as candidate skills."""
    if not nlp:
        # fallback: return frequent capitalized words / bigrams
        tokens = re.findall(r"[A-Z][a-zA-Z\-/+]{2,}", text)
        return list(dict.fromkeys(tokens))[:top_n]

    doc = nlp(text)
    phrases = set()
    for chunk in doc.noun_chunks:
        # filter long/short chunks
        tok = chunk.text.strip()
        if 2 <= len(tok) <= 60:
            phrases.add(tok)
    for ent in doc.ents:
        phrases.add(ent.text.strip())
    # return in document order
    ordered = [p for p in (chunk.text.strip() for chunk in doc.noun_chunks) if p in phrases]
    seen = set()
    out = []
    for p in ordered:
        if p not in seen:
            out.append(p)
            seen.add(p)
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
    candidates = _candidate_skill_phrases(text)
    education = extract_education(text)
    experience = extract_experience(text)

    # simple normalization of candidate skills
    skills = []
    for s in candidates:
        s_clean = re.sub(r"\s+", " ", s).strip()
        if len(s_clean) > 1 and not s_clean.isdigit():
            skills.append(s_clean)

    return {
        "text": text,
        "skills": skills,
        "education": education,
        "experience": experience,
    }
