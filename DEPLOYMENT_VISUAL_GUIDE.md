# 📱 Visual Step-by-Step Deployment Guide

Complete visual walkthrough for deploying on Vercel and Render.

---

## 🎯 Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  AI Resume Coach App                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────┐    ┌──────────────────────┐  │
│  │    Frontend (React)     │    │   Backend (FastAPI)  │  │
│  │       VERCEL            │◄──►│       RENDER         │  │
│  │  your-app.vercel.app    │    │  app.onrender.com    │  │
│  └─────────────────────────┘    └──────────────────────┘  │
│                                           │                  │
│                                           ▼                  │
│                                   ┌──────────────────┐       │
│                                   │   PostgreSQL DB  │       │
│                                   │      RENDER      │       │
│                                   └──────────────────┘       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 📚 Table of Contents

1. [Backend Deployment (Render)](#backend-render)
2. [Frontend Deployment (Vercel)](#frontend-vercel)
3. [Connection & Testing](#testing)
4. [Troubleshooting](#troubleshooting)

---

## 🔧 Backend Deployment (Render)

### Step 1: Create Render Account

1. Go to https://render.com
2. Click **Sign Up**
3. Choose **Sign up with GitHub** (recommended)
4. Authorize Render to access your repositories

### Step 2: Create Backend Web Service

1. In Render Dashboard, click **New +** (top right)
2. Select **Web Service**

```
Dashboard
   ├─ New +
   │   ├─ Web Service  ◄─── Select this
   │   ├─ PostgreSQL
   │   ├─ Redis
   │   └─ ...
   └─ ...
```

3. **Connect your repository**
   - Search for your GitHub repo: `Agentic-AI-Resume-Coach`
   - Click **Connect**

### Step 3: Configure Service

Fill in the form:

| Field | Value | Note |
|-------|-------|------|
| **Name** | `ai-resume-coach-backend` | Appears in dashboard |
| **Environment** | `Python 3` | Language selection |
| **Region** | `us-east-1` (or closest) | Data center location |
| **Branch** | `main` | GitHub branch to deploy |
| **Root Directory** | `backend` | Service root folder |

### Step 4: Set Build & Start Commands

Find the "Build Command" and "Start Command" fields:

**Build Command:**
```bash
pip install -r requirements.txt
```

**Start Command:**
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Step 5: Add Environment Variables

1. Click **Environment** tab (or scroll down)
2. Add each variable:

**Click "Add Environment Variable" for each:**

```
Key: AI_PROVIDER
Value: local

Key: JWT_EXPIRE_MINUTES
Value: 120

Key: ENVIRONMENT
Value: production

Key: JWT_SECRET_KEY
Value: [paste from deploy script output or generate:
        python -c "import secrets; print(secrets.token_hex(32))"]

Key: GOOGLE_API_KEY
Value: [optional - your Gemini API key from Google]
```

**Leave DATABASE_URL blank for now** - we'll add it after creating PostgreSQL.

### Step 6: Create PostgreSQL Database

1. In Render Dashboard, click **New +**
2. Select **PostgreSQL**

```
Fill the form:
├─ Name: ai-resume-coach-db
├─ Database: ai_resume_coach
├─ User: postgres
├─ Region: [same as backend]
└─ Plan: Free (or Starter for production)
```

3. Click **Create Database**
4. Wait ~1 minute for creation
5. When ready, copy the **Internal Database URL**
   - Looks like: `postgresql://username:password@host:port/database`

### Step 7: Add DATABASE_URL to Backend

1. Go back to backend service
2. Click **Environment**
3. Click **Add Environment Variable**
4. Paste the PostgreSQL Internal URL:
   ```
   Key: DATABASE_URL
   Value: [paste the Internal Database URL from PostgreSQL]
   ```

### Step 8: Deploy Backend

1. Click **Create Web Service** button at bottom
2. Render will start building:
   - Installing dependencies (~30 seconds)
   - Building the service (~30 seconds)
3. Watch the **Logs** tab
4. When you see `Uvicorn running on 0.0.0.0:...`, it's ready!

### Step 9: Get Your Backend URL

When deployment is complete:
1. Copy the URL from the top of the service page
   - Example: `https://ai-resume-coach-backend.onrender.com`
2. **Save this** - you'll need it for the frontend!

### Step 10: Test Backend

Open a terminal and test:

```bash
curl https://ai-resume-coach-backend.onrender.com/health
```

You should get a response. If not, check the **Logs** tab.

---

## 🎨 Frontend Deployment (Vercel)

### Step 1: Create Vercel Account

1. Go to https://vercel.com
2. Click **Sign Up**
3. Select **Continue with GitHub**
4. Authorize Vercel to access your repositories

### Step 2: Create New Project

1. Go to https://vercel.com/dashboard
2. Click **Add New +** (top right)
3. Select **Project**

```
Dashboard
   ├─ Add New +
   │   ├─ Project         ◄─── Select this
   │   ├─ Environment
   │   └─ ...
   └─ ...
```

### Step 3: Import Repository

1. Find your repo in the list: `Agentic-AI-Resume-Coach`
2. Click **Import**

### Step 4: Configure Project

The configuration screen appears:

```
Project Settings
├─ Framework Preset: Vite ✓
├─ Root Directory: frontend  ◄─── IMPORTANT: Change to "frontend"
├─ Build Command: npm run build
├─ Output Directory: dist
└─ Environment Variables: ▼
```

**Important:** Change **Root Directory** to `frontend`

### Step 5: Set Environment Variables

1. Click **Environment Variables** section
2. Add:

```
Variable Name: VITE_API_BASE_URL
Value: https://ai-resume-coach-backend.onrender.com
(use the URL from backend deployment)
```

### Step 6: Deploy

1. Click **Deploy** button
2. Vercel will:
   - Install dependencies (~20 seconds)
   - Build the project (~30 seconds)
   - Deploy to CDN (~10 seconds)
3. Watch the **Deployments** tab

### Step 7: Get Your Frontend URL

When deployment is complete:
1. See the URL at the top: `your-app.vercel.app`
2. **Save this** - you'll need it for CORS configuration

### Step 8: Test Frontend

1. Click the project URL
2. The app should load!
3. Try uploading a resume

---

## 🔌 Connection & Testing

### Step 1: Update Backend CORS

Your backend needs to allow requests from your Vercel frontend.

Edit `backend/main.py`:

Find this section:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    ...
)
```

Add your Vercel URL:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://your-app.vercel.app",  # ◄── Add this line
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Step 2: Commit and Push

```bash
git add backend/main.py
git commit -m "Update CORS for Vercel deployment"
git push origin main
```

### Step 3: Verify Auto-Deploy

**Render (Backend):**
- Should auto-redeploy when you push to main
- Check the **Deployments** tab
- Wait for "Deploy successful"

**Vercel (Frontend):**
- Should auto-redeploy when you push to main
- Check the **Deployments** tab
- Wait for "Ready" status

### Step 4: End-to-End Testing

1. Open your Vercel frontend URL: `https://your-app.vercel.app`
2. Upload a resume (PDF)
3. Paste a job description
4. Click **Analyze**
5. Watch the progress bar
6. See the results!

**Expected flow:**
- Frontend → Calls Backend API → Backend processes with AI agents → Returns results → Frontend displays

### Step 5: Check Logs if Issues

**Backend Logs (Render):**
1. Go to https://render.com/dashboard
2. Click your backend service
3. Click **Logs** tab
4. Look for errors

**Frontend Logs (Vercel):**
1. Go to https://vercel.com/dashboard
2. Click your project
3. Click latest **Deployment**
4. Click **Logs** tab
5. Look for build or runtime errors

---

## 🐛 Troubleshooting

### Issue: Frontend Can't Connect to Backend

**Symptoms:**
- Error in browser console: `CORS error` or `Network error`
- Results not showing

**Fix:**
1. Check backend URL in Vercel environment variables
2. Verify backend is running: `curl https://backend-url.onrender.com/health`
3. Add Vercel URL to CORS in `backend/main.py`
4. Redeploy backend

**Example CORS fix:**
```python
# Make sure your Vercel URL is here
allow_origins=[
    "https://your-app.vercel.app",  # ◄── Add this
    "http://localhost:5173",
]
```

### Issue: Backend Deployment Failed

**Symptoms:**
- Red "Deploy failed" message in Render dashboard

**Fix:**
1. Click the failed deployment
2. Click **Logs** tab
3. Read the error message
4. Common issues:
   - Missing `requirements.txt` → Check file exists in `backend/` folder
   - Missing dependencies → Add to `requirements.txt`
   - Missing environment variable → Check PostgreSQL URL
   - Wrong Python version → Render uses Python 3, you need 3.10+

**Example error: `ModuleNotFoundError: No module named 'langgraph'`**
- Solution: `pip install langgraph` locally, then `pip freeze > requirements.txt`

### Issue: Frontend Deployment Failed

**Symptoms:**
- Red "Failed" status in Vercel Deployments

**Fix:**
1. Click the deployment
2. Click **Logs** tab
3. Common issues:
   - Wrong root directory → Change to `frontend`
   - Build error → Check `npm run build` works locally: `cd frontend && npm run build`
   - Missing dependencies → `cd frontend && npm install`

### Issue: App Loads But Analysis Doesn't Work

**Symptoms:**
- Frontend loads fine
- Upload resume and job description
- Click analyze, nothing happens

**Fix:**
1. Open browser **DevTools** (F12)
2. Click **Network** tab
3. Click **Analyze** button
4. Look for failed requests to backend
5. Check:
   - Is the request going to correct backend URL?
   - Is backend responding?
   - Are there CORS errors?

**Terminal test:**
```bash
# Test if backend is accessible
curl https://your-backend.onrender.com/health

# Should return something like:
# {"status":"ok"}
```

### Issue: Database Connection Error

**Symptoms:**
- Backend deploys but returns database errors
- Logs show: `could not connect to server`

**Fix:**
1. Check `DATABASE_URL` is set in Render backend environment
2. Verify PostgreSQL service is running (not destroyed)
3. Check PostgreSQL service is in same region as backend
4. Copy Internal Database URL again (not External)

**Location:** Render Dashboard → PostgreSQL service → Copy Internal URL

### Issue: Timeout Errors During Analysis

**Symptoms:**
- Analysis starts but times out after 30 seconds
- Error: `Request timeout`

**Fix:**
1. This is normal for first analysis (cold start)
2. Render free tier services sleep after 15 minutes
3. Solutions:
   - Wait longer (first analysis takes 30-60 seconds)
   - Upgrade to Starter plan ($7/month)
   - Use monitoring service to keep backend alive

---

## ✅ Deployment Verification Checklist

After deployment, verify each item:

- [ ] Backend service is running on Render
  - Test: `curl https://backend-url.onrender.com/health`
- [ ] PostgreSQL database is created
  - Check: Render Dashboard → Databases
- [ ] Frontend is deployed on Vercel
  - Test: Open https://your-app.vercel.app
- [ ] Frontend can reach backend
  - Open DevTools → Network tab → Check API calls
- [ ] Analyze workflow works end-to-end
  - Upload resume, add job description, click Analyze
- [ ] Results display correctly
  - Check all 4 tabs (Resume, Job Match, Cover Letter, Interview)
- [ ] No console errors
  - DevTools → Console tab → No red errors
- [ ] Backend logs show requests
  - Render dashboard → Backend → Logs → See API calls

---

## 📞 Getting Help

If you're stuck:

1. **Check service logs first** (most issues visible there)
   - Render backend logs
   - Vercel build logs
2. **Test with curl** (verify connectivity)
   - `curl https://backend-url.onrender.com/health`
3. **Check browser DevTools** (see actual errors)
   - F12 → Console → Network tabs
4. **Review CORS configuration** (most common issue)
   - Verify Vercel URL in `allow_origins`
5. **Contact support**
   - Render support: https://render.com/help
   - Vercel support: https://vercel.com/support

---

## 🎉 Success!

Once everything is working:

1. Share your app: `https://your-app.vercel.app`
2. Invite others to use it
3. Monitor performance in both dashboards
4. Scale as needed (upgrade plans)

Congratulations! Your AI Resume Coach is live! 🚀
