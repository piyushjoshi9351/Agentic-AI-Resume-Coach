#!/bin/bash
# Deployment Helper Script for AI Resume Coach
# This script helps prepare and verify your deployment setup

set -e

echo "🚀 AI Resume Coach - Deployment Helper"
echo "========================================"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check prerequisites
echo -e "${BLUE}Step 1: Checking Prerequisites${NC}"
echo "---"

# Check Git
if command -v git &> /dev/null; then
    print_success "Git installed"
else
    print_error "Git not found. Please install Git."
    exit 1
fi

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    print_success "Python $PYTHON_VERSION installed"
else
    print_error "Python 3 not found. Please install Python 3.10+"
    exit 1
fi

# Check Node
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node $NODE_VERSION installed"
else
    print_error "Node not found. Please install Node.js 18+"
    exit 1
fi

echo ""

# Generate JWT Secret
echo -e "${BLUE}Step 2: Generating JWT Secret${NC}"
echo "---"

JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
print_success "JWT Secret generated: ${JWT_SECRET:0:10}..."
echo "  Full secret: $JWT_SECRET"
echo "  Save this in backend/.env as JWT_SECRET_KEY"
echo ""

# Check file structure
echo -e "${BLUE}Step 3: Verifying Project Structure${NC}"
echo "---"

PROJECT_ROOT=$(pwd)
print_info "Project root: $PROJECT_ROOT"

# Check backend
if [ -d "backend" ]; then
    print_success "Backend folder found"
    
    if [ -f "backend/main.py" ]; then
        print_success "backend/main.py found"
    else
        print_error "backend/main.py not found"
    fi
    
    if [ -f "backend/requirements.txt" ]; then
        print_success "backend/requirements.txt found"
    else
        print_error "backend/requirements.txt not found"
    fi
else
    print_error "Backend folder not found"
fi

# Check frontend
if [ -d "frontend" ]; then
    print_success "Frontend folder found"
    
    if [ -f "frontend/package.json" ]; then
        print_success "frontend/package.json found"
    else
        print_error "frontend/package.json not found"
    fi
    
    if [ -f "frontend/vite.config.js" ]; then
        print_success "frontend/vite.config.js found"
    else
        print_error "frontend/vite.config.js not found"
    fi
else
    print_error "Frontend folder not found"
fi

echo ""

# Check environment files
echo -e "${BLUE}Step 4: Checking Environment Files${NC}"
echo "---"

if [ -f "backend/.env" ]; then
    print_success "backend/.env exists"
else
    print_warning "backend/.env not found. Creating from template..."
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        print_success "backend/.env created from template"
    fi
fi

if [ -f "frontend/.env.local" ]; then
    print_success "frontend/.env.local exists"
else
    print_warning "frontend/.env.local not found. Creating from template..."
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env.local
        print_success "frontend/.env.local created from template"
    fi
fi

echo ""

# Check git status
echo -e "${BLUE}Step 5: Git Status${NC}"
echo "---"

if git rev-parse --git-dir > /dev/null 2>&1; then
    print_success "Git repository detected"
    
    UNCOMMITTED=$(git status --porcelain | wc -l)
    if [ $UNCOMMITTED -gt 0 ]; then
        print_warning "$UNCOMMITTED files have uncommitted changes"
        echo "  Run 'git status' to see details"
        echo "  Don't forget to commit before deploying!"
    else
        print_success "All changes committed"
    fi
else
    print_error "Not a git repository"
fi

echo ""

# Test local backend setup
echo -e "${BLUE}Step 6: Testing Backend Setup (Optional)${NC}"
echo "---"

read -p "Do you want to test backend setup? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Checking Python dependencies..."
    cd backend
    
    if python3 -m pip list | grep -q fastapi; then
        print_success "FastAPI installed"
    else
        print_warning "FastAPI not installed. Run: pip install -r requirements.txt"
    fi
    
    if python3 -m pip list | grep -q langgraph; then
        print_success "LangGraph installed"
    else
        print_warning "LangGraph not installed. Run: pip install -r requirements.txt"
    fi
    
    cd ..
fi

echo ""

# Test local frontend setup
echo -e "${BLUE}Step 7: Testing Frontend Setup (Optional)${NC}"
echo "---"

read -p "Do you want to test frontend setup? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Checking Node dependencies..."
    cd frontend
    
    if [ -d "node_modules" ]; then
        print_success "node_modules found"
    else
        print_warning "node_modules not found. Run: npm install"
    fi
    
    cd ..
fi

echo ""

# Final summary
echo -e "${BLUE}Deployment Preparation Summary${NC}"
echo "========================================"
echo ""

echo "✅ Prerequisites checked"
echo "✅ Project structure verified"
echo "✅ Environment files prepared"
echo ""

echo "📝 Next Steps:"
echo ""
echo "1. Update backend/.env with:"
echo "   - JWT_SECRET_KEY=$JWT_SECRET"
echo "   - GOOGLE_API_KEY (if using Gemini)"
echo "   - DATABASE_URL (after creating Render PostgreSQL)"
echo ""
echo "2. Update frontend/.env.local with:"
echo "   - VITE_API_BASE_URL (after backend is deployed)"
echo ""
echo "3. Push to GitHub:"
echo "   git add ."
echo "   git commit -m 'Prepare for deployment'"
echo "   git push"
echo ""
echo "4. Deploy backend on Render:"
echo "   - New Web Service → Select your repo"
echo "   - Root: backend"
echo "   - Build: pip install -r requirements.txt"
echo "   - Start: uvicorn main:app --host 0.0.0.0 --port \$PORT"
echo ""
echo "5. Deploy frontend on Vercel:"
echo "   - Import project → Select your repo"
echo "   - Root: frontend"
echo "   - Add VITE_API_BASE_URL env var"
echo ""
echo "📖 For detailed guide, see: DEPLOYMENT.md"
echo "⚡ Quick reference, see: QUICK_DEPLOY.md"
echo ""

print_success "Deployment preparation complete!"
