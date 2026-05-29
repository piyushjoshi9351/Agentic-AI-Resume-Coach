"""
Configuration Management for AI Resume Coach Backend
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Settings:
    """Application settings loaded from environment"""
    
    # API Configuration
    API_TITLE = "AI Resume & Job Coach API"
    API_VERSION = "1.0.0"
    API_DESCRIPTION = "Multi-Agent AI system for resume analysis and career coaching"
    
    # CORS Configuration
    CORS_ORIGINS = [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # React dev server
        "http://127.0.0.1:5173",
    ]
    
    # Google Gemini Configuration
    AI_PROVIDER = os.getenv("AI_PROVIDER", "local").lower()
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    GEMINI_MODEL = os.getenv("PRIMARY_GEMINI_MODEL", "gemini-2.0-flash")
    GEMINI_FALLBACK_MODEL = os.getenv("FALLBACK_GEMINI_MODEL", "gemini-2.0-flash-lite")
    GEMINI_TEMPERATURE = 0.7
    GEMINI_TOP_P = 0.9
    GEMINI_TOP_K = 40
    
    # Validation Configuration
    MIN_RESUME_LENGTH = 100  # Minimum characters in extracted resume
    MIN_JOB_DESCRIPTION_LENGTH = 50  # Minimum characters in job description
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    # Logging Configuration
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Server Configuration
    HOST = "0.0.0.0"
    PORT = 8000
    RELOAD = True
    
    @classmethod
    def validate(cls):
        """Validate required settings"""
        if cls.AI_PROVIDER == "gemini" and not cls.GOOGLE_API_KEY:
            raise ValueError(
                "GOOGLE_API_KEY environment variable not set. "
                "Please set it in your .env file or environment, or switch AI_PROVIDER=local."
            )
        return True


# Create settings instance
settings = Settings()
settings.validate()
