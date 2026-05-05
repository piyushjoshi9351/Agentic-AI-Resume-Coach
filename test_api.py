"""
Example script for testing the AI Resume Coach API
Run this after starting the FastAPI server: python main.py
"""

import asyncio
import httpx
import json
from pathlib import Path
from test_utils import SAMPLE_RESUME, SAMPLE_JOB_DESCRIPTION

# API endpoint
API_URL = "http://localhost:8000"
ANALYZE_ENDPOINT = f"{API_URL}/analyze"


async def test_health_check():
    """Test the health check endpoint"""
    print("\n" + "="*60)
    print("Testing Health Check Endpoint")
    print("="*60)
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{API_URL}/health")
            print(f"Status: {response.status_code}")
            print(f"Response: {response.json()}")
            return response.status_code == 200
        except Exception as e:
            print(f"Error: {e}")
            return False


async def test_analysis_with_text():
    """Test the analysis endpoint with raw text (not actual PDF)"""
    print("\n" + "="*60)
    print("Testing Analysis Endpoint with Sample Data")
    print("="*60)
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            # Prepare form data
            data = {
                "job_description": SAMPLE_JOB_DESCRIPTION
            }
            
            files = {
                "resume": ("sample_resume.pdf", b"%PDF-1.4\n" + SAMPLE_RESUME.encode())
            }
            
            print(f"Sending request to {ANALYZE_ENDPOINT}...")
            print(f"Resume length: {len(SAMPLE_RESUME)} characters")
            print(f"Job description length: {len(SAMPLE_JOB_DESCRIPTION)} characters")
            
            response = await client.post(
                ANALYZE_ENDPOINT,
                data=data,
                files=files
            )
            
            print(f"\nStatus: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print("\n✓ Analysis completed successfully!")
                print(f"\nResponse keys: {list(result.keys())}")
                
                # Display summaries
                if "resume_analysis" in result and result["resume_analysis"]:
                    analysis = result["resume_analysis"]
                    print(f"\nResume Analysis:")
                    print(f"  - Skills identified: {len(analysis.get('skills', {}).get('technical', []))} technical")
                    print(f"  - Experience entries: {len(analysis.get('experience', []))}")
                    
                if "job_match" in result and result["job_match"]:
                    match = result["job_match"]
                    print(f"\nJob Match:")
                    print(f"  - ATS Score: {match.get('ats_match_score', 'N/A')}%")
                    print(f"  - Match Level: {match.get('match_level', 'N/A')}")
                
                if "cover_letter" in result and result["cover_letter"]:
                    cover = result["cover_letter"]
                    print(f"\nCover Letter:")
                    print(f"  - Generated: {len(cover)} characters")
                    print(f"  - Preview: {cover[:200]}...")
                
                if "interview_questions" in result and result["interview_questions"]:
                    questions = result["interview_questions"]
                    print(f"\nInterview Questions:")
                    print(f"  - Total questions: {len(questions)}")
                    if questions:
                        print(f"  - First question: {questions[0].get('question', 'N/A')[:100]}...")
                
                return True
            else:
                print(f"Error: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
            return False


async def test_with_real_pdf(pdf_path: str):
    """Test analysis endpoint with a real PDF file"""
    print("\n" + "="*60)
    print(f"Testing Analysis with Real PDF: {pdf_path}")
    print("="*60)
    
    if not Path(pdf_path).exists():
        print(f"Error: PDF file not found: {pdf_path}")
        return False
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            with open(pdf_path, "rb") as f:
                files = {
                    "resume": (Path(pdf_path).name, f)
                }
                data = {
                    "job_description": SAMPLE_JOB_DESCRIPTION
                }
                
                print(f"Uploading PDF: {pdf_path}")
                response = await client.post(
                    ANALYZE_ENDPOINT,
                    data=data,
                    files=files
                )
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print("\n✓ Analysis completed successfully!")
                
                # Save results to file
                with open("analysis_results.json", "w") as f:
                    json.dump(result, f, indent=2)
                print("\nResults saved to: analysis_results.json")
                
                return True
            else:
                print(f"Error: {response.text}")
                return False
                
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
            return False


async def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("AI Resume Coach API - Test Suite")
    print("="*60)
    print("\nMake sure the FastAPI server is running:")
    print("  python main.py")
    print("\n" + "="*60)
    
    # Test health check
    health_ok = await test_health_check()
    
    if not health_ok:
        print("\n✗ Health check failed. Is the server running?")
        return
    
    # Test analysis endpoint
    print("\n\nNote: First API call may take 30-60 seconds as agents process...")
    analysis_ok = await test_analysis_with_text()
    
    if analysis_ok:
        print("\n✓ All tests passed!")
        
        # Try real PDF if it exists
        pdf_path = "../test_resume.pdf"
        if Path(pdf_path).exists():
            print("\n" + "="*60)
            pdf_ok = await test_with_real_pdf(pdf_path)
            if pdf_ok:
                print("\n✓ Real PDF test passed!")
    else:
        print("\n✗ Tests failed")


if __name__ == "__main__":
    asyncio.run(main())
