import requests
import tempfile
from reportlab.pdfgen import canvas
import time

API = 'http://127.0.0.1:8000'

# Helper to create a tiny PDF
def make_pdf(path, text="Senior Python developer with REST API development, Django, Streamlit, SQL, and Git."):
    c = canvas.Canvas(path)
    c.setFont("Helvetica", 10)
    c.drawString(72, 720, text)
    c.showPage()
    c.save()


def main():
    # Register
    sess = requests.Session()
    email = f"smoke+{int(time.time())}@example.com"
    reg = sess.post(f"{API}/auth/register", json={"name": "Smoke Tester", "email": email, "password": "Password123"})
    if reg.status_code != 200:
        print('Register failed', reg.status_code, reg.text)
        return
    token = reg.json().get('access_token')
    sess.headers.update({'Authorization': f'Bearer {token}'})
    print('Registered and authenticated as', email)

    # Create PDF
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
        make_pdf(tmp.name)
        pdf_path = tmp.name

    # Analyze resume
    with open(pdf_path, 'rb') as f:
        files = {'resume': ('resume.pdf', f, 'application/pdf')}
        data = {'job_description': 'Looking for a Python developer with REST API development, Django, Streamlit, SQL, and Git.'}
        resp = sess.post(f"{API}/analyze", files=files, data=data, timeout=120)
    print('Analyze status', resp.status_code)
    if resp.status_code != 200:
        print(resp.text)
        return
    analysis = resp.json()
    print('Analysis received, id:', analysis.get('analysis_id'))

    # Start interview session
    start = sess.post(f"{API}/interview/session/start", json={"analysis_id": analysis.get('analysis_id')})
    print('Start interview', start.status_code)
    if start.status_code != 200:
        print(start.text)
        return
    session_data = start.json()
    session_id = session_data.get('session_id')
    print('Interview session id', session_id)

    # Evaluate first question
    questions = session_data.get('questions', [])
    if questions:
        q = questions[0].get('question') if isinstance(questions[0], dict) else questions[0]
        eval_resp = sess.post(f"{API}/interview/session/evaluate", json={
            'session_id': session_id,
            'question_index': 0,
            'question': q,
            'answer': 'I have built REST APIs using Django and FastAPI, used Postgres and ORMs, and shipped features.'
        })
        print('Evaluate status', eval_resp.status_code)
        print(eval_resp.json())

    # Give the server a moment to persist
    time.sleep(1)

    # Fetch ATS history and interview history
    ats = sess.get(f"{API}/api/history/ats")
    interviews = sess.get(f"{API}/api/history/interviews")
    print('ATS history', ats.status_code, len(ats.json()) if ats.status_code==200 else ats.text)
    print('Interviews', interviews.status_code, len(interviews.json()) if interviews.status_code==200 else interviews.text)

if __name__ == '__main__':
    main()
