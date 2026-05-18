import requests
from bs4 import BeautifulSoup


def fetch_job_description(url: str) -> str:
    """Fetch the main job description text from a job posting URL.

    This is a best-effort extractor — many job boards use dynamic content or JS.
    For complex sites, consider using Playwright (not included here).
    """
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    html = resp.text
    soup = BeautifulSoup(html, "html.parser")
    # Attempt to pull main article text
    selectors = ["article", "#job-description", ".job-description", ".description", "#jd"]
    for sel in selectors:
        el = soup.select_one(sel)
        if el and el.text.strip():
            return el.get_text(separator="\n").strip()
    # Fallback: return large text blocks
    paragraphs = [p.get_text() for p in soup.find_all("p")]
    text = "\n\n".join(paragraphs)
    return text
