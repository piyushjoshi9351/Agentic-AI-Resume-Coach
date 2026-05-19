import re


def normalize_transcript(text: str) -> str:
    cleaned = re.sub(r"\s+", " ", (text or "").strip())
    return cleaned


def extract_focus_skills(text: str, limit: int = 6) -> list[str]:
    tokens = re.findall(r"[A-Za-z][A-Za-z0-9+.#/-]{2,}", (text or "").lower())
    results: list[str] = []
    for token in tokens:
        value = token.strip(". -_/+")
        if len(value) < 3:
            continue
        if value not in results:
            results.append(value)
        if len(results) >= limit:
            break
    return results