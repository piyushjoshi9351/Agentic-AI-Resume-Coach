# 🚀 Deployment Guide: Vercel (Frontend) + Render (Backend)

This guide walks you through deploying your AI Resume Coach application with:
- **Frontend** → Vercel
- **Backend + AI Agents** → Render

---

## 📋 Prerequisites

1. **GitHub Repository**: Push your code to GitHub
2. **Vercel Account**: Sign up at https://vercel.com
3. **Render Account**: Sign up at https://render.com
4. **Google API Key** (optional): For Gemini AI integration
5. **Git** installed locally

---

## Phase 1: Prepare the Project

### Step 1.1: Update Frontend Configuration

The frontend needs to know the backend URL. Update your frontend environment files:

Create `frontend/.env.production`:
```env
VITE_API_BASE_URL=https://your-backend-service.onrender.com
```

Create `frontend/.env.development`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

The frontend will automatically use the appropriate environment based on build type.

### Step 1.2: Verify Backend Entry Point

Your `backend/main.py` should have CORS configured for the frontend domain.

Make sure the FastAPI app has proper CORS configuration for Vercel domain:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://your-frontend-domain.vercel.app",  # Add your Vercel domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Step 1.3: Ensure Root-Level Files Are in Backend

Files like `agents.py` and `graph.py` at the root should be accessible from the backend:
- Either copy them to `backend/` folder
- Or ensure they're imported correctly from the root in `backend/main.py`

### Step 1.4: Create Vercel Configuration

Create `frontend/vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_BASE_URL": "@vite_api_base_url"
  }
}
```

---

## Phase 2: Deploy Backend on Render

### Step 2.1: Create Web Service on Render

1. **Log in** to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository (if not already connected)
4. Select your repository

### Step 2.2: Configure the Service

Fill in the following fields:

| Field | Value |
|-------|-------|
| **Name** | `ai-resume-coach-backend` |
| **Environment** | `Python 3` |
| **Region** | Choose closest to your users (e.g., us-east-1) |
| **Branch** | `main` |
| **Root Directory** | `backend` |

### Step 2.3: Build & Start Commands

- **Build Command**: 
  ```bash
  pip install -r requirements.txt
  ```

- **Start Command**: 
  ```bash
  uvicorn main:app --host 0.0.0.0 --port $PORT
  ```

### Step 2.4: Configure Environment Variables

Click **Environment** and add:

| Key | Value | Notes |
|-----|-------|-------|
| `GOOGLE_API_KEY` | Your Google Gemini API key | [Get key here](https://makersuite.google.com/app/apikey) - Optional |
| `AI_PROVIDER` | `local` or `gemini` | Use `local` for fallback mode without Gemini |
| `JWT_SECRET_KEY` | Generate with: `python -c "import secrets; print(secrets.token_hex(32))"` | For JWT authentication |
| `JWT_EXPIRE_MINUTES` | `120` | Token expiration time |
| `DATABASE_URL` | Auto-configured | Will be provided by Render PostgreSQL |
| `ENVIRONMENT` | `production` | |

### Step 2.5: Add PostgreSQL Database

1. In Render Dashboard, click **New +** → **PostgreSQL**
2. Configure:
   - **Name**: `ai-resume-coach-db`
   - **Database**: `ai_resume_coach`
   - **User**: `postgres`
   - **Region**: Same as backend service
   - **Plan**: Free or Starter

3. After creation, copy the **Internal Database URL**
4. Add to backend environment variables as `DATABASE_URL`

### Step 2.6: Deploy Backend

1. Click **Create Web Service**
2. Wait for deployment to complete (~2-3 minutes)
3. Note the backend URL: `https://ai-resume-coach-backend.onrender.com` (example)

### Step 2.7: Verify Backend is Running

Test the backend health:
```bash
curl https://ai-resume-coach-backend.onrender.com/health
```

---

## Phase 3: Deploy Frontend on Vercel

### Step 3.1: Create Project on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New +** → **Project**
3. Select your GitHub repository

### Step 3.2: Configure Project Settings

**Root Directory**: Select `frontend` folder

### Step 3.3: Set Environment Variables

Click **Environment Variables** and add:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://ai-resume-coach-backend.onrender.com` |

Replace with your actual backend URL from Step 2.6.

### Step 3.4: Build Settings

- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install` (default)

### Step 3.5: Deploy

Click **Deploy** and wait for deployment (~2-3 minutes)

Your frontend will be available at: `https://your-project-name.vercel.app`

---

## Phase 4: Update CORS & Communication

### Step 4.1: Update Backend CORS

Once you have both URLs, update the CORS configuration in `backend/main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://your-project-name.vercel.app",  # Your Vercel frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Step 4.2: Redeploy Backend

1. Push the CORS changes to GitHub
2. Render will auto-redeploy (if auto-deploy is enabled)
3. Or manually trigger deployment in Render dashboard

---

## Phase 5: Testing & Validation

### Step 5.1: Test Frontend-Backend Communication

1. Open your Vercel frontend URL
2. Upload a resume and provide a job description
3. Click **Analyze**
4. Check browser DevTools (F12 → Network) to ensure requests go to the backend

### Step 5.2: Check Logs

**Backend Logs** (Render):
- Dashboard → Select backend service → **Logs** tab

**Frontend Logs** (Vercel):
- Dashboard → Select project → **Deployments** tab → Click deployment → **Logs**

### Step 5.3: Monitor Services

Set up monitoring:
- **Render**: Dashboard → Service → **Metrics** tab
- **Vercel**: Dashboard → Project → **Analytics** tab

---

## 🔧 Troubleshooting

### Frontend Can't Connect to Backend
- [ ] Check `VITE_API_BASE_URL` environment variable is set correctly
- [ ] Ensure backend URL doesn't have trailing slash: `https://backend.onrender.com`
- [ ] Check CORS configuration in `backend/main.py`
- [ ] Verify backend is running: curl the `/health` endpoint

### Backend Deployment Fails
- [ ] Check build log: Look for missing dependencies
- [ ] Ensure `requirements.txt` is in `backend/` folder
- [ ] Verify all environment variables are set
- [ ] Check `DATABASE_URL` is configured correctly

### Database Connection Error
- [ ] Verify PostgreSQL service is running in Render
- [ ] Confirm `DATABASE_URL` is set as environment variable
- [ ] Check database credentials are correct
- [ ] Run migrations if needed

### Cold Start Issues
- [ ] Render free tier services spin down after 15 minutes of inactivity
- [ ] Consider upgrading to Starter plan for better uptime
- [ ] Use monitoring/ping service to keep services warm

---

## 📊 Environment Variables Summary

### Backend (Render)
```
GOOGLE_API_KEY=xxx                          # Optional: Gemini API key
AI_PROVIDER=local                           # local or gemini
JWT_SECRET_KEY=xxx                          # Random 32-byte hex string
JWT_EXPIRE_MINUTES=120
DATABASE_URL=postgresql://...               # Auto-configured
ENVIRONMENT=production
```

### Frontend (Vercel)
```
VITE_API_BASE_URL=https://backend.onrender.com
```

---

## 🔐 Security Considerations

1. **Never commit `.env` files** - Use platform environment variables
2. **Use strong JWT secret** - Generate cryptographically secure key
3. **Enable HTTPS** - Both Vercel and Render use HTTPS by default
4. **Rotate API keys regularly** - Google Gemini and JWT secrets
5. **Restrict CORS origins** - Only allow your frontend domain
6. **Use environment-specific secrets** - Different keys for dev/prod

---

## 📈 Scaling & Optimization

### Vercel
- Automatic scaling
- CDN included
- Edge functions available on paid plans

### Render
- Manual or auto-scaling available on paid plans
- Free tier limited to 1 service per project
- Consider upgrading for production use

---

## ✅ Deployment Checklist

- [ ] GitHub repository set up and pushed
- [ ] Frontend environment variables configured
- [ ] Backend environment variables configured
- [ ] PostgreSQL database created on Render
- [ ] Backend deployed on Render and tested
- [ ] Frontend deployed on Vercel and tested
- [ ] CORS configured with correct frontend URL
- [ ] Frontend-backend communication verified
- [ ] Logs checked for errors
- [ ] Monitoring set up
- [ ] Security best practices implemented

---

## 📚 Additional Resources

- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)

---

## 🆘 Getting Help

If deployment issues persist:
1. Check service logs in both platforms
2. Test backend endpoint: `curl https://backend.onrender.com/health`
3. Verify environment variables are set
4. Check browser DevTools for API errors
5. Review CORS error messages in backend logs
