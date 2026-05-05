"""
Test utilities for AI Resume Coach Backend
Includes test data and helper functions for local testing
"""

import json
import io
from pathlib import Path

# Sample test resume text
SAMPLE_RESUME = """
JOHN SMITH
San Francisco, CA | john.smith@email.com | (555) 123-4567 | LinkedIn.com/in/johnsmith

PROFESSIONAL SUMMARY
Senior Software Engineer with 5+ years of experience developing scalable cloud applications.
Proficient in Python, JavaScript, and cloud architecture. Strong background in distributed systems
and machine learning. Proven track record of leading technical teams and delivering enterprise solutions.

TECHNICAL SKILLS
Languages: Python, JavaScript, TypeScript, SQL, Java
Frameworks: FastAPI, React, Django, Spring Boot
Cloud & DevOps: AWS (EC2, S3, Lambda), Docker, Kubernetes, CI/CD pipelines
Databases: PostgreSQL, MongoDB, Redis
Tools: Git, Jira, Apache Spark, TensorFlow

PROFESSIONAL EXPERIENCE

Senior Software Engineer | Tech Company Inc. | San Francisco, CA | Jan 2022 - Present
• Led development of microservices architecture supporting 1M+ daily transactions
• Designed and implemented Python/FastAPI REST APIs with 99.9% uptime
• Mentored team of 3 junior engineers, improving code quality by 40%
• Optimized database queries reducing latency by 60%

Software Engineer | StartUp Co. | San Francisco, CA | Jun 2019 - Dec 2021
• Built full-stack React/Python applications for 500+ enterprise clients
• Implemented real-time data pipeline using Apache Spark processing 10GB/day
• Developed Docker/Kubernetes deployment strategies reducing infrastructure costs by 35%
• Implemented comprehensive test suite achieving 85% code coverage

Junior Software Engineer | First Company | San Francisco, CA | Jun 2018 - May 2019
• Developed backend features in Python and JavaScript
• Collaborated with product team on feature requirements and UX improvements

EDUCATION
B.S. in Computer Science | University of California, Berkeley | 2018
GPA: 3.7/4.0 | Dean's List: All Semesters

CERTIFICATIONS
• AWS Certified Solutions Architect - Professional (2021)
• Kubernetes Certified Application Developer (2020)

PROJECTS & OPEN SOURCE
• FastAPI-Advanced (GitHub): 500+ stars - Advanced patterns for FastAPI applications
• ML-Pipeline-Framework: Contributed to major ML infrastructure library
"""

# Sample job description
SAMPLE_JOB_DESCRIPTION = """
Senior Software Engineer - Backend
Tech Company Inc. | San Francisco, CA

About the Role
We are seeking a Senior Software Engineer to join our growing backend team. You will be responsible
for designing and implementing scalable microservices that power our platform serving millions of users.
This is a key technical leadership role offering the opportunity to mentor junior engineers and shape
our technical direction.

Responsibilities
• Design and implement robust REST APIs and microservices using modern frameworks
• Collaborate with product and frontend teams to deliver features
• Ensure code quality through testing, code review, and best practices
• Optimize system performance and database queries
• Mentor junior engineers and conduct technical interviews
• Participate in architecture decisions and technical strategy

Requirements
• 5+ years of professional software engineering experience
• Expert-level knowledge of Python or similar backend language
• Experience building and maintaining microservices at scale
• Strong understanding of relational and NoSQL databases
• Experience with cloud platforms (AWS, GCP, or Azure)
• Strong system design and architectural thinking
• Excellent communication and teamwork skills

Nice to Have
• Experience with Kubernetes and container orchestration
• Knowledge of machine learning or data processing pipelines
• Experience with event-driven architectures (Kafka, RabbitMQ)
• Open source contributions
• AWS certifications

We Offer
• Competitive salary and equity
• Comprehensive health insurance
• Remote-friendly work environment
• Professional development budget
• Collaborative and innovative team culture
"""

def create_test_pdf():
    """Create a simple test PDF file with resume content"""
    try:
        from reportlab.pdfgen import canvas
        from io import BytesIO
        
        buffer = BytesIO()
        c = canvas.Canvas(buffer)
        
        # Add text to PDF
        y = 750
        lines = SAMPLE_RESUME.split('\n')
        for line in lines:
            if y < 50:
                c.showPage()
                y = 750
            if line.strip():
                c.drawString(50, y, line[:100])  # Limit line length
                y -= 15
        
        c.save()
        buffer.seek(0)
        return buffer
    except ImportError:
        raise ImportError("reportlab not installed. Install with: pip install reportlab")


def format_analysis_for_display(analysis: dict) -> str:
    """Format analysis output for console display"""
    return json.dumps(analysis, indent=2)


def print_test_results(response: dict) -> None:
    """Pretty print test results"""
    print("\n" + "="*80)
    print("ANALYSIS RESULTS")
    print("="*80)
    
    if "resume_analysis" in response:
        print("\n--- RESUME ANALYSIS ---")
        print(format_analysis_for_display(response["resume_analysis"]))
    
    if "job_match" in response:
        print("\n--- JOB MATCH ---")
        print(format_analysis_for_display(response["job_match"]))
    
    if "cover_letter" in response:
        print("\n--- COVER LETTER ---")
        print(response["cover_letter"])
    
    if "interview_questions" in response:
        print("\n--- INTERVIEW QUESTIONS ---")
        for idx, q in enumerate(response["interview_questions"], 1):
            print(f"\nQuestion {idx}: {q.get('question', 'N/A')}")
            print(f"Type: {q.get('type', 'N/A')}")
            if "strong_answer_example" in q:
                print(f"Answer: {q['strong_answer_example'][:500]}...")
    
    print("\n" + "="*80)


if __name__ == "__main__":
    print("Test utilities loaded")
    print(f"Sample resume length: {len(SAMPLE_RESUME)} characters")
    print(f"Sample job description length: {len(SAMPLE_JOB_DESCRIPTION)} characters")
