import sys
import pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
# Also ensure backend dir is on path so imports like `import graph` resolve
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'backend'))
from fastapi.testclient import TestClient
from backend.main import app
import tempfile
from reportlab.pdfgen import canvas
import json

# Capture prints to a log file for CI-style verification
_log_file = pathlib.Path(__file__).resolve().parents[1] / 'scripts' / 'smoke_client_log.txt'
_log_fh = open(_log_file, 'w', encoding='utf-8')
_orig_print = print
def _print(*a, **k):
    _orig_print(*a, **k)
    _log_fh.write(' '.join(str(x) for x in a) + "\n")
    _log_fh.flush()
print = _print

client = TestClient(app)

# create pdf
def make_pdf_bytes(text="Senior Python developer with REST API development, Django, Streamlit, SQL, and Git."):
    from io import BytesIO
    buffer = BytesIO()
    c = canvas.Canvas(buffer)
    c.setFont("Helvetica", 10)
    lines = [
        text,
        "Built production REST APIs with FastAPI and Django, integrated Postgres,",
        "shipped analytics dashboards in Streamlit, automated deployment pipelines,",
        "and worked with SQL, Git, Docker, and cloud-hosted services across multiple teams.",
    ]
    y = 720
    for line in lines:
        c.drawString(72, y, line)
        y -= 18
    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.read()


def main():
    # Register
    email = f"smoke+test@example.com"
    r = client.post('/auth/register', json={"name": "Smoke Tester", "email": email, "password": "Password123"})
    print('register', r.status_code, r.json() if r.status_code==200 else r.text)
    token = r.json().get('access_token')
    headers = {'Authorization': f'Bearer {token}'}

    # Analyze
    pdf_bytes = make_pdf_bytes()
    files = { 'resume': ('resume.pdf', pdf_bytes, 'application/pdf') }
    data = { 'job_description': 'Looking for a Python developer with REST API development, Django, Streamlit, SQL, and Git.' }
    resp = client.post('/analyze', files=files, data=data, headers=headers)
    print('analyze', resp.status_code)
    if resp.status_code!=200:
        print(resp.text)
        return
    analysis = resp.json()
    print('analysis id', analysis.get('analysis_id'))

    # Start interview
    start = client.post('/interview/session/start', json={'analysis_id': analysis.get('analysis_id')}, headers=headers)
    print('start interview', start.status_code)
    session = start.json()
    sid = session.get('session_id')
    print('session id', sid)

    # Evaluate
    questions = session.get('questions', [])
    if questions:
        q = questions[0].get('question') if isinstance(questions[0], dict) else questions[0]
        ev = client.post('/interview/session/evaluate', json={'session_id': sid, 'question_index': 0, 'question': q, 'answer': 'I have solid experience building REST APIs using Django and FastAPI.'}, headers=headers)
        print('evaluate', ev.status_code, ev.json())

    # Get history
    ats = client.get('/api/history/ats', headers=headers)
    inter = client.get('/api/history/interviews', headers=headers)
    print('ats history', ats.status_code, len(ats.json()) if ats.status_code==200 else ats.text)
    print('interview history', inter.status_code, len(inter.json()) if inter.status_code==200 else inter.text)

if __name__=='__main__':
    main()
