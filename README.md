<!--
        PR-ready README
        - Do NOT add secrets, API keys, or private data to this file or to the repository.
        - Use `.env.example` as the template for environment variables; commit only the example file.
        - Replace the image/GIF placeholders in the `docs/` folder; do not embed binary assets directly in README.
-->

# AI Resume & Job Coach

Multi-agent resume analysis, ATS scoring, cover-letter generation, and interview coaching.

![Project Badge](https://img.shields.io/badge/AI%20Resume%20%26%20Job%20Coach-Ready-brightgreen)

Short, focused README for PRs and contributors. This document intentionally omits any private keys or sensitive information.

## Quick links

- Code: [backend](backend/) and [frontend](frontend/)
- Demo (local): http://localhost:5173
- Contributing guide: [CONTRIBUTING.md](CONTRIBUTING.md) (see below)

---

## What it does

This repository implements a coordinated, multi-agent pipeline to analyze a candidate's resume against a job description and produce:

- An ATS-style match score and matched/missing skills
- Actionable skill-gap recommendations
- A tailored cover letter draft
- Practice interview questions and answer scaffolding

The system is built to run locally with a deterministic fallback when cloud LLMs (e.g., Google Gemini) are unavailable.

## Project status

- Backend: FastAPI services and LangGraph orchestration
- Frontend: React + Vite + Tailwind UI
- Local-first: Works without cloud API keys using fallback logic

If you open a PR, follow the checklist below and avoid adding secrets to commits.

---

## Screenshots & GIFs (placeholders)

Replace these placeholders in `docs/` and reference them here. Do NOT commit real credentials or private data into the repository.

- Demo hero GIF (replace): docs/gifs/demo-hero.gif  <!-- add your GIF here -->
- Screenshot: docs/screenshots/resume-analysis.png

Tip: Use small, optimized GIFs or a short MP4. Keep images in `docs/` and reference them from README.

---

## Requirements

- Python 3.10+
- Node.js 18+ and npm 9+

## Local development (quick)

1. Clone the repo

```bash
git clone https://github.com/piyushjoshi9351/Agentic-AI-Resume-Coach.git
cd Agentic-AI-Resume-Coach
```

2. Backend (local)

```bash
cd backend
python -m venv .venv
# Activate the venv (Windows)
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate
pip install -r requirements.txt
```

Create a `backend/.env` file from the template. Do NOT commit real secrets.

```bash
cp backend/.env.example backend/.env
# Edit backend/.env locally with real secrets (never commit)
```

3. Frontend

```bash
cd frontend
npm install
npm run dev
```

4. Start backend API

```bash
cd backend
python main.py
```

Open http://localhost:5173 and try the Analyze flow.

---

## Environment variables (example)

Only list variable names here. Never paste actual secrets.

- Backend (example only):
        - `AI_PROVIDER` (local|gemini)
        - `DATABASE_URL`
        - `JWT_SECRET_KEY` (store securely)
        - `GOOGLE_API_KEY` (only if using Gemini)

- Frontend:
        - `VITE_API_BASE_URL`

Create a `backend/.env.example` (or update it) and commit that — do not commit `backend/.env`.

---

## Tests & linting

- Backend: run unit tests in `backend/` (if present) with your Python test runner
- Frontend: `npm --prefix frontend run lint` and `npm --prefix frontend run build`

---

## Deployment notes

- This repository includes a `render.yaml` for Render deploys and a `Dockerfile` for container builds.
- In production, use a managed database, secure env management, and rotate keys regularly.

---

## Contribution & PR checklist

Before opening a PR:

1. Run linters and tests for changed modules.
2. Remove any hard-coded credentials or debug prints.
3. Add/update docs/screenshots in `docs/` — use placeholders in README until assets are added.
4. Add a short PR description and test steps.

Recommended PR template content (short):

- What changed and why
- How to test locally
- Any env vars required (do not include values)

---

## Security & privacy

- Never commit keys, passwords, or private files. Use `backend/.env` locally and keep it out of Git.
- If a secret is accidentally committed, rotate it immediately and remove it from history.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

If you want, I can also create or update `backend/.env.example`, add a short `CONTRIBUTING.md`, and insert GIF placeholders into `docs/` for this PR.
