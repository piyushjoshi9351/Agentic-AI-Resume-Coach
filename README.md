# AI Resume & Job Coach - Backend API

A production-grade multi-agent AI system built with LangGraph + Google Gemini + FastAPI for intelligent resume analysis and career coaching.

## Project Overview

The backend is a FastAPI application that orchestrates a multi-agent pipeline using LangGraph:

1. **Resume Analyzer Agent** - Extracts skills, experience, education, strengths, and weaknesses
2. **Job Matcher Agent** - Calculates ATS match score and identifies skill gaps
3. **Cover Letter Agent** - Generates personalized 4-paragraph cover letters
4. **Interview Coach Agent** - Creates 8 interview questions with comprehensive answers

## Project Structure

```
backend/
├── main.py              # FastAPI app with /analyze endpoint
├── agents.py            # 4 agent functions using Gemini 1.5 Flash
├── graph.py             # LangGraph StateGraph orchestration
├── .env                 # Environment variables (GOOGLE_API_KEY)
├── __init__.py          # Package initialization
└── README.md            # This file
```

## Setup Instructions

### 1. Prerequisites

- Python 3.10 or higher
- Google API Key with Gemini access
- pip package manager

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Create a `.env` file in the `backend/` directory:

```env
GOOGLE_API_KEY=your_google_api_key_here
```

Get your API key from: https://makersuite.google.com/app/apikey

### 4. Run the Server

```bash
# From the backend directory
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`

## API Documentation

### Endpoints

#### Health Check
- **GET** `/health`
- **Response**: `{"status": "healthy", "service": "AI Resume & Job Coach API"}`

#### Analyze Resume and Job
- **POST** `/analyze`
- **Accepts**:
  - `resume`: PDF file (multipart/form-data)
  - `job_description`: String (form field)
- **Returns**: 
  ```json
  {
    "resume_analysis": {
      "skills": {...},
      "experience": [...],
      "education": [...],
      "strengths": [...],
      "weaknesses": [...],
      "overall_assessment": {...}
    },
    "job_match": {
      "ats_match_score": 85,
      "match_level": "Strong Match",
      "matching_skills": [...],
      "missing_skills": [...],
      "recommendation": "..."
    },
    "cover_letter": "...",
    "interview_questions": [...]
  }
  ```

### API Interactive Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### CORS Configuration

The API is configured to accept requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (React dev server)
- `http://127.0.0.1:5173`

Add additional origins in `main.py` if needed.

## Agent Details

### Resume Analyzer Agent
- Extracts structured information from resumes
- Identifies technical and soft skills
- Analyzes work experience and achievements
- Evaluates education and certifications
- Provides strengths and weaknesses assessment

### Job Matcher Agent
- Calculates ATS (Applicant Tracking System) match score (0-100)
- Identifies which job requirements are met
- Lists missing skills and experience gaps
- Assesses career progression fit
- Provides hiring recommendation

### Cover Letter Agent
- Generates personalized 4-paragraph cover letters
- References specific resume achievements
- Shows understanding of company mission
- Professional tone with strong call-to-action
- Tailored to job description requirements

### Interview Coach Agent
- Creates 8 interview questions (tailored to resume + job)
  - 3 Technical questions
  - 2 Behavioral questions (STAR format)
  - 2 Role-specific questions
  - 1 Tricky/edge-case question
- Provides comprehensive answer frameworks
- Includes strategic tips and common mistakes to avoid

## Error Handling

The API includes comprehensive error handling:

- **Invalid PDF**: Returns 400 with error message
- **Empty resume/job description**: Returns 400 with validation error
- **API failures**: Returns 500 with error description
- **Global exception handler**: Catches and logs unhandled errors

## Logging

Logs are configured to show:
- Agent execution status
- Error messages with full stack traces
- Processing timestamps
- Request information

View logs in console output when running the server.

## Performance Considerations

- **Sequential Agent Execution**: Agents run sequentially, with each agent using output from previous agents
- **PDF Parsing**: Handles multi-page PDFs efficiently
- **Gemini API**: Uses 1.5 Flash model for speed and cost-effectiveness
- **JSON Response Size**: Complete analysis typically returns 5-15KB of data

## Development

### Running Tests

```bash
pytest tests/
```

### Code Quality

The codebase follows:
- PEP 8 style guidelines
- Type hints throughout
- Comprehensive docstrings
- Proper error handling and logging

### Adding Custom Agents

To add new agents:

1. Create a new agent function in `agents.py` with signature: `def agent_name(state: dict) -> dict`
2. Add a node in `graph.py`: `workflow.add_node("agent_name", agent_name)`
3. Add edges to connect to the pipeline

## Dependencies

Key dependencies:
- **FastAPI**: Modern async web framework
- **Uvicorn**: ASGI server
- **LangChain**: LLM framework
- **LangGraph**: Orchestration framework
- **pypdf**: PDF text extraction
- **google-generativeai**: Gemini API access
- **pydantic**: Data validation

## Troubleshooting

### "GOOGLE_API_KEY not set" Error
- Ensure `.env` file exists in backend directory
- Check that GOOGLE_API_KEY is correctly set
- Restart the server after updating .env

### PDF Extraction Issues
- Ensure PDF is valid and not corrupted
- Some PDFs with images require OCR (not supported yet)
- Try extracting text manually to verify content

### Timeout Issues
- Agent processing may take 30-60 seconds for complete analysis
- Increase timeout in frontend if needed
- Monitor API logs for performance bottlenecks

## Production Deployment

For production deployment:

1. Use environment variables (not .env file)
2. Set appropriate security headers
3. Use a production ASGI server (Gunicorn + Uvicorn)
4. Enable HTTPS
5. Add API rate limiting
6. Set up monitoring and alerting

Example production startup:
```bash
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact the development team.
