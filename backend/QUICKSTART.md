# Quick Start Guide - Backend Setup

Get the AI Resume Coach backend running in 5 minutes.

## Step 1: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This installs:
- FastAPI and Uvicorn (web framework)
- LangChain + LangGraph (multi-agent orchestration)
- Google Gemini API client
- pypdf (PDF text extraction)
- And all other required dependencies

## Step 2: Set Up Environment

Ensure your `.env` file in the `backend/` directory contains:

```env
GOOGLE_API_KEY=your_actual_google_api_key
```

**Get your free API key:**
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API key"
3. Copy your key and paste into `.env`

## Step 3: Start the Server

```bash
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

## Step 4: Test the API

### Option A: Using the Interactive API Docs

Open your browser to: **http://localhost:8000/docs**

This shows the Swagger UI where you can:
1. Click on the `/analyze` endpoint
2. Click "Try it out"
3. Upload a PDF resume
4. Paste a job description
5. Click "Execute"

### Option B: Using the Test Script

In another terminal:

```bash
cd backend
python test_api.py
```

This tests the health endpoint and runs a sample analysis with test data.

### Option C: Using cURL

```bash
# Test health check
curl http://localhost:8000/health

# Test analysis (requires real files)
curl -X POST http://localhost:8000/analyze \
  -F "resume=@/path/to/resume.pdf" \
  -F "job_description=Your job description here" \
  http://localhost:8000/analyze
```

## What Happens When You Call `/analyze`

The FastAPI backend orchestrates a 4-agent pipeline:

```
1. Resume Analyzer
   ↓
   Extracts: skills, experience, education, strengths, weaknesses
   
2. Job Matcher
   ↓
   Calculates: ATS score (0-100), matching skills, missing skills
   
3. Cover Letter Writer
   ↓
   Generates: Professional 4-paragraph personalized cover letter
   
4. Interview Coach
   ↓
   Creates: 8 interview questions with comprehensive answers
   
Returns: JSON with all 4 outputs
```

**Time: 30-60 seconds** (first call may be slower due to model initialization)

## API Response Example

```json
{
  "resume_analysis": {
    "skills": {
      "technical": ["Python", "FastAPI", "React", ...],
      "soft_skills": ["Leadership", "Communication", ...]
    },
    "experience": [...],
    "strengths": [...],
    "weaknesses": [...],
    "overall_assessment": {...}
  },
  "job_match": {
    "ats_match_score": 85,
    "match_level": "Strong Match",
    "matching_skills": [...],
    "missing_skills": [...]
  },
  "cover_letter": "...4 paragraph cover letter...",
  "interview_questions": [
    {
      "question_number": 1,
      "type": "Technical",
      "question": "Tell me about...",
      "strong_answer_example": "..."
    },
    ...
  ]
}
```

## Troubleshooting

### "GOOGLE_API_KEY not set" Error

```
ValueError: GOOGLE_API_KEY environment variable not set
```

**Fix:**
1. Check `.env` file exists in `backend/` directory
2. Verify `GOOGLE_API_KEY=...` is set correctly
3. Restart the server

### "Connection refused" when calling API

```
httpx.ConnectError: Connection refused
```

**Fix:**
1. Make sure server is running: `python main.py`
2. Check it's running on `http://localhost:8000`
3. Try curl: `curl http://localhost:8000/health`

### "Invalid file format" Error

```
400: Invalid file format. Please upload a valid PDF file.
```

**Fix:**
1. Ensure you're uploading a real PDF file (not text)
2. PDF should not be corrupted
3. Use test_resume.pdf if available

### API Timeout (> 60 seconds)

**Normal for first request** - Gemini model is initializing

**If persistent:**
1. Check internet connection
2. Verify API key is valid
3. Check Google Cloud quota usage

## Next Steps

1. **Start frontend development** (React/Vite on port 5173)
2. **Integrate with frontend** - Call `/analyze` endpoint from React
3. **Add authentication** - Add API key or JWT protection
4. **Deploy to production** - Use Gunicorn + Uvicorn

## File Structure

```
backend/
├── main.py              ← FastAPI app (start here)
├── agents.py            ← 4 AI agents using Gemini
├── graph.py             ← LangGraph orchestration
├── config.py            ← Configuration management
├── test_api.py          ← Test script
├── test_utils.py        ← Test utilities
├── .env                 ← Environment variables (your API key)
├── requirements.txt     ← Python dependencies
└── README.md            ← Full documentation
```

## Production Deployment

For production, see the full README.md for:
- Using Gunicorn with multiple workers
- Setting HTTPS/SSL
- Rate limiting
- Monitoring and logging
- Environment configuration

## Support

- Full API docs: http://localhost:8000/docs
- Code comments explain every function
- Logs show detailed agent execution

Happy coding! 🚀
