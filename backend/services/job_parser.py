"""Job URL parser with static extraction, dynamic fallback, LLM structuring, and caching."""

from __future__ import annotations

import hashlib
import re
from urllib.parse import urlparse

import os
import requests
from bs4 import BeautifulSoup

from ..ai_schemas import ParsedJobModel
from .cache import cache_client
from .llm_router import llm_router

AI_PROVIDER = os.getenv("AI_PROVIDER", "local").lower()

COMMON_SKILLS = [
    "python", "django", "fastapi", "flask", "sql", "postgresql", "mysql", "react",
    "javascript", "typescript", "aws", "docker", "kubernetes", "machine learning",
    "llm", "nlp", "streamlit", "pandas", "numpy", "api", "rest api",
]

COMMON_LOCATIONS = [
    "remote", "san francisco", "new york", "california", "hyderabad", "bangalore",
    "bengaluru", "delhi", "mumbai", "pune", "india", "usa", "united states",
]


def _is_valid_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
        return parsed.scheme in {"http", "https"} and bool(parsed.netloc)
    except Exception:
        return False


def _extract_visible_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.extract()
    text = " ".join(s.strip() for s in soup.stripped_strings)
    return re.sub(r"\s+", " ", text).strip()


def _fetch_static(url: str) -> str:
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    }
    response = requests.get(url, headers=headers, timeout=20)
    response.raise_for_status()
    return _extract_visible_text(response.text)


async def _fetch_dynamic_playwright(url: str) -> str:
    try:
        from playwright.async_api import async_playwright
    except Exception:
        return ""

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            content = await page.content()
            await browser.close()
            return _extract_visible_text(content)
    except Exception:
        return ""


def _structured_fallback(raw_text: str) -> dict:
    return ParsedJobModel(
        title="",
        company="",
        location="",
        skills=[],
        responsibilities=[],
        experience_level="",
        raw_text=raw_text[:6000],
    ).model_dump()


def _heuristic_parse(raw_text: str) -> dict:
    lower_text = raw_text.lower()
    skills = [skill for skill in COMMON_SKILLS if skill in lower_text]

    title = ""
    title_match = re.search(r"([A-Z][A-Za-z0-9+&/\- ]{2,80}?(?:Engineer|Developer|Scientist|Analyst|Manager|Designer|Architect))", raw_text)
    if title_match:
        title = title_match.group(1).strip()

    location = ""
    for loc in COMMON_LOCATIONS:
        if loc in lower_text:
            location = loc.title()
            break

    responsibilities = []
    for line in raw_text.splitlines():
        cleaned = line.strip("-•\t ")
        if len(cleaned) < 20:
            continue
        if any(word in cleaned.lower() for word in ["build", "develop", "design", "maintain", "collaborate", "implement", "manage", "create", "analyze", "support"]):
            responsibilities.append(cleaned)
        if len(responsibilities) >= 6:
            break

    if not responsibilities:
        responsibilities = ["Work on core role responsibilities based on the posting details."]

    years_required = 0
    year_match = re.search(r"(\d+)\+?\s*(?:years?|yrs?)", lower_text)
    if year_match:
        years_required = int(year_match.group(1))

    if years_required >= 5:
        experience_level = "Senior"
    elif years_required >= 3:
        experience_level = "Mid"
    elif years_required > 0:
        experience_level = "Entry"
    else:
        experience_level = "Not specified"

    company = ""
    company_match = re.search(r"at\s+([A-Z][A-Za-z0-9&.,\- ]{2,60})", raw_text)
    if company_match:
        company = company_match.group(1).strip()

    return {
        "title": title,
        "company": company,
        "location": location,
        "skills": skills,
        "responsibilities": responsibilities,
        "experience_level": experience_level,
        "raw_text": raw_text[:6000],
    }


async def parse_job_url(url: str) -> dict:
    if not _is_valid_url(url):
        raise ValueError("Invalid URL")

    cache_key = f"job-parse:{hashlib.sha256(url.encode()).hexdigest()}"
    cached = cache_client.get(cache_key)
    if cached:
        return cached

    raw_text = ""
    try:
        raw_text = _fetch_static(url)
    except Exception:
        raw_text = ""

    if len(raw_text) < 500:
        dynamic_text = await _fetch_dynamic_playwright(url)
        if len(dynamic_text) > len(raw_text):
            raw_text = dynamic_text

    if not raw_text:
        raise RuntimeError("Could not extract job content from URL")

    system_prompt = (
        "You are an expert job description parser. Extract structured fields from raw job listing text. "
        "If not present, keep values empty strings or empty arrays."
    )

    user_prompt = (
        f"Parse this job listing text into strict JSON.\n\nURL: {url}\n\nTEXT:\n{raw_text[:12000]}"
    )

    if AI_PROVIDER != "gemini":
        parsed = _heuristic_parse(raw_text)
    else:
        parsed = llm_router.generate_json(
            schema_model=ParsedJobModel,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            fallback_data=_structured_fallback(raw_text),
        )

    if not parsed.get("raw_text"):
        parsed["raw_text"] = raw_text[:6000]

    cache_client.set(cache_key, parsed, ttl_seconds=1800)
    return parsed
