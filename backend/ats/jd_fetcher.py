from __future__ import annotations

import os
from typing import Any

import requests
from bs4 import BeautifulSoup

JSEARCH_API_URL = "https://jsearch.p.rapidapi.com/search"
JSEARCH_DEFAULT_HOST = "jsearch.p.rapidapi.com"


def _build_jsearch_headers() -> dict[str, str]:
    api_key = os.getenv("JSEARCH_API_KEY") or os.getenv("RAPIDAPI_KEY")
    api_host = os.getenv("JSEARCH_API_HOST") or os.getenv("RAPIDAPI_HOST") or JSEARCH_DEFAULT_HOST

    if not api_key:
        raise ValueError("JSearch API key is not configured. Set JSEARCH_API_KEY in your environment.")

    return {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": api_host,
    }


def _build_location(item: dict[str, Any]) -> str:
    parts = [
        item.get("job_city"),
        item.get("job_state"),
        item.get("job_country"),
    ]
    cleaned = [str(part).strip() for part in parts if part and str(part).strip()]
    return ", ".join(cleaned)


def search_jobs(query: str, page: int = 1, num_pages: int = 1) -> list[dict[str, Any]]:
    """Fetch live jobs from JSearch via RapidAPI."""
    query = (query or "").strip()
    if not query:
        raise ValueError("Search query is required.")

    headers = _build_jsearch_headers()
    response = requests.get(
        JSEARCH_API_URL,
        headers=headers,
        params={
            "query": query,
            "page": max(page, 1),
            "num_pages": max(num_pages, 1),
            "date_posted": "all",
        },
        timeout=20,
    )
    response.raise_for_status()
    payload = response.json()
    items = payload.get("data") or payload.get("jobs") or []

    jobs: list[dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        title = item.get("job_title") or item.get("title") or "Untitled role"
        company = item.get("employer_name") or item.get("company_name") or item.get("company") or "Unknown company"
        description = item.get("job_description") or item.get("description") or ""
        location = _build_location(item)
        job_url = item.get("job_apply_link") or item.get("job_google_link") or item.get("job_id") or ""

        jobs.append(
            {
                "title": title,
                "company": company,
                "description": description,
                "location": location,
                "job_url": job_url,
                "employment_type": item.get("job_employment_type") or "",
                "source": "JSearch",
            }
        )

    return jobs


def fetch_job_description(url: str) -> str:
    """Fetch the main job description text from a job posting URL.

    This is a best-effort extractor — many job boards use dynamic content or JS.
    For complex sites, consider using Playwright (not included here).
    """
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    html = resp.text
    soup = BeautifulSoup(html, "html.parser")
    selectors = ["article", "#job-description", ".job-description", ".description", "#jd"]
    for sel in selectors:
        el = soup.select_one(sel)
        if el and el.text.strip():
            return el.get_text(separator="\n").strip()
    paragraphs = [p.get_text() for p in soup.find_all("p")]
    return "\n\n".join(paragraphs)
