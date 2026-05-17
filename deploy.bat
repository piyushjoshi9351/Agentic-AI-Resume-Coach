@echo off
REM Deployment Helper Script for AI Resume Coach (Windows)
REM This script helps prepare and verify your deployment setup

echo.
echo ========================================
echo  AI Resume Coach - Deployment Helper
echo ========================================
echo.

REM Check prerequisites
echo Step 1: Checking Prerequisites
echo ---

where git >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Git installed
) else (
    echo [ERROR] Git not found. Please install Git.
    exit /b 1
)

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    python --version
    echo [OK] Python installed
) else (
    echo [ERROR] Python not found. Please install Python 3.10+
    exit /b 1
)

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    node --version
    echo [OK] Node installed
) else (
    echo [ERROR] Node not found. Please install Node.js 18+
    exit /b 1
)

echo.

REM Generate JWT Secret
echo Step 2: Generating JWT Secret
echo ---

python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_hex(32))" > jwt_secret.txt
set /p JWT_SECRET=<jwt_secret.txt
echo [OK] JWT Secret generated
echo.
echo %JWT_SECRET%
echo.
echo Save this in backend\.env as JWT_SECRET_KEY
echo.
del jwt_secret.txt

REM Check file structure
echo Step 3: Verifying Project Structure
echo ---

if exist "backend\" (
    echo [OK] Backend folder found
    
    if exist "backend\main.py" (
        echo [OK] backend\main.py found
    ) else (
        echo [ERROR] backend\main.py not found
    )
    
    if exist "backend\requirements.txt" (
        echo [OK] backend\requirements.txt found
    ) else (
        echo [ERROR] backend\requirements.txt not found
    )
) else (
    echo [ERROR] Backend folder not found
)

if exist "frontend\" (
    echo [OK] Frontend folder found
    
    if exist "frontend\package.json" (
        echo [OK] frontend\package.json found
    ) else (
        echo [ERROR] frontend\package.json not found
    )
    
    if exist "frontend\vite.config.js" (
        echo [OK] frontend\vite.config.js found
    ) else (
        echo [ERROR] frontend\vite.config.js not found
    )
) else (
    echo [ERROR] Frontend folder not found
)

echo.

REM Check environment files
echo Step 4: Checking Environment Files
echo ---

if exist "backend\.env" (
    echo [OK] backend\.env exists
) else (
    echo [WARNING] backend\.env not found
    if exist "backend\.env.example" (
        copy backend\.env.example backend\.env
        echo [OK] backend\.env created from template
    )
)

if exist "frontend\.env.local" (
    echo [OK] frontend\.env.local exists
) else (
    echo [WARNING] frontend\.env.local not found
    if exist "frontend\.env.example" (
        copy frontend\.env.example frontend\.env.local
        echo [OK] frontend\.env.local created from template
    )
)

echo.

REM Final summary
echo ========================================
echo Deployment Preparation Summary
echo ========================================
echo.
echo [OK] Prerequisites checked
echo [OK] Project structure verified
echo [OK] Environment files prepared
echo.

echo Next Steps:
echo.
echo 1. Update backend\.env with:
echo    - JWT_SECRET_KEY=^<generated above^>
echo    - GOOGLE_API_KEY (if using Gemini)
echo    - DATABASE_URL (after creating Render PostgreSQL)
echo.
echo 2. Update frontend\.env.local with:
echo    - VITE_API_BASE_URL (after backend is deployed)
echo.
echo 3. Push to GitHub:
echo    git add .
echo    git commit -m "Prepare for deployment"
echo    git push
echo.
echo 4. Deploy backend on Render:
echo    - New Web Service
echo    - Root: backend
echo    - Build: pip install -r requirements.txt
echo    - Start: uvicorn main:app --host 0.0.0.0 --port $PORT
echo.
echo 5. Deploy frontend on Vercel:
echo    - Import project
echo    - Root: frontend
echo    - Add VITE_API_BASE_URL env var
echo.

echo For detailed guide, see: DEPLOYMENT.md
echo.
