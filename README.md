# 🚀 AI Resume & Job Coach 🤖

### Land Interviews Faster with a Multi-Agent Career Intelligence System

![Banner](https://img.shields.io/badge/AI%20Resume%20%26%20Job%20Coach-Multi--Agent%20Career%20Engine-7c3aed?style=for-the-badge)

![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-Orchestration-111827)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini%20%2F%20Local-Fallback-4285F4?logo=google&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=111827)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-06B6D4?logo=tailwindcss&logoColor=white)

AI Resume & Job Coach is a full-stack application that analyzes resumes against job descriptions using a coordinated 4-agent pipeline.
It combines LangGraph orchestration, FastAPI APIs, and a dark-mode React UI.
The app delivers ATS match scoring, skill-gap insights, personalized cover letters, and interview coaching in one workflow.
When Gemini is unavailable or disabled, the backend uses deterministic local fallback logic so the app still returns useful output.

## ✨ How It Works

### Multi-Agent Pipeline (ASCII Diagram)

```
[Resume PDF + Job Description]
             |
             v
   [Agent 1: Resume Analyzer]
             |
             v
     [Agent 2: Job Matcher]
             |
             v
   [Agent 3: Cover Letter Writer]
             |
             v
    [Agent 4: Interview Coach]
             |
             v
[ATS Score + Skill Gaps + Cover Letter + Interview Prep]
```

### Agent Responsibilities

| Agent | Role | Output |
|---|---|---|
| Agent 1 | Resume Analyzer | Skills, experience, education, strengths, weaknesses |
| Agent 2 | Job Matcher | ATS score, matched skills, missing skills, fit recommendation |
| Agent 3 | Cover Letter Writer | 4-paragraph tailored cover letter |
| Agent 4 | Interview Coach | 8 structured interview questions with strong answer frameworks |

## 🌟 Features

- 📄 Resume PDF parsing and structured intelligence extraction
- 🎯 ATS match scoring with explainable fit signals
- 🧩 Skill gap analysis with actionable recommendations
- ✍️ Personalized cover letter generation
- 🎤 Interview prep with technical, behavioral, role-specific, and tricky questions
- ⚡ Multi-agent orchestration powered by LangGraph
- 🖥️ Premium responsive React UI with rich animations

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Language | Python, JavaScript |
| Backend API | FastAPI, Uvicorn |
| AI Orchestration | LangGraph |
| LLM | Google Gemini or local fallback |
| AI SDK | langchain-google-genai, langchain-core |
| PDF Processing | pypdf |
| Frontend | React 18, Vite |
| UI Styling | Tailwind CSS, Lucide Icons |

## ⚙️ Setup Instructions

### 1. Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+
- Google API key only if you want Gemini mode; local fallback works without it

### 2. Clone Repository

```bash
git clone https://github.com/piyushjoshi9351/Agentic-AI-Resume-Coach.git
cd Agentic-AI-Resume-Coach
```

### 3. Backend Setup

```bash
cd backend
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

Create environment file in backend folder. Never commit your real API keys or secrets:

```env
GOOGLE_API_KEY=your_google_api_key_here
JWT_SECRET_KEY=replace_with_a_long_random_secret
AI_PROVIDER=local
```

### 4. Frontend Setup

```bash
cd ../frontend
npm install
```

### 5. Run the App

Start backend (terminal 1):

```bash
cd backend
python main.py
```

Start frontend (terminal 2):

```bash
cd frontend
npm run dev
```

Open the frontend at http://localhost:5173 or the next available Vite port if 5173 is busy.

## 🚀 Deployment

### Recommended: Render

This repo includes a `render.yaml` blueprint for a live backend and a separate static frontend.

1. Push the repo to GitHub.
2. Create a new Render blueprint from `render.yaml`.
3. Set `VITE_API_BASE_URL` on the frontend to your deployed backend URL.
4. Set `CORS_ORIGINS` or `FRONTEND_URL` on the backend to your deployed frontend URL.
5. Use managed PostgreSQL in production. SQLite is for local development only.

### Environment Variables

- Backend: `AI_PROVIDER`, `JWT_SECRET_KEY`, `DATABASE_URL`, `CORS_ORIGINS`, `FRONTEND_URL`, `GOOGLE_API_KEY` if Gemini is enabled
- Frontend: `VITE_API_BASE_URL`

## 📸 Screenshots

> Add your screenshots after the first demo run.

- Hero + input screen: `docs/screenshots/hero-input.png`
- Agent progress loading: `docs/screenshots/agent-progress.png`
- Resume analysis tab: `docs/screenshots/resume-analysis.png`
- ATS match tab: `docs/screenshots/job-match.png`
- Cover letter tab: `docs/screenshots/cover-letter.png`
- Interview prep tab: `docs/screenshots/interview-prep.png`

## 🗂️ Project Structure

```text
ai-resume-coach/
├── backend/
│   ├── main.py
│   ├── agents.py
│   ├── graph.py
│   ├── config.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── tailwind.config.js
├── README.md
└── .gitignore
```

## 💎 Why This Project Is Unique

- It demonstrates true multi-agent coordination instead of a single prompt chain.
- It fuses product UX and AI engineering into a deployable full-stack system.
- It outputs recruiter-relevant artifacts, not just generic text generation.
- It is portfolio-ready for AI Engineer, Full-Stack AI, and Applied LLM roles.

## 🔒 Security Notes

- Real secrets belong in `backend/.env` and should stay out of Git.
- Use `.env.example` as the template for new environments.
- If Gemini quota is unavailable, set `AI_PROVIDER=local` to keep the app usable.

## 📄 License

This project is licensed under the MIT License.
