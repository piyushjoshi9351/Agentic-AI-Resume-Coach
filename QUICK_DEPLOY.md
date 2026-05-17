# 🚀 Quick Deployment Checklist

## Pre-Deployment Setup (5 mins)

### 1. Create Environment Files

```bash
# Frontend
cp frontend/.env.example frontend/.env.local
# Edit and set: VITE_API_BASE_URL=http://localhost:8000

# Backend  
cp backend/.env.example backend/.env
# Edit and set database/API keys
```

### 2. Generate JWT Secret

```bash
python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_hex(32))"
```

Copy this into `backend/.env`

---

## Deployment Steps (15 mins)

### Backend on Render

1. **Create Web Service**
   - New → Web Service
   - Connect GitHub repo
   - Root Directory: `backend`

2. **Build & Start**
   ```
   Build: pip install -r requirements.txt
   Start: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

3. **Environment Variables**
   ```
   AI_PROVIDER=local
   JWT_EXPIRE_MINUTES=120
   JWT_SECRET_KEY=<paste from step 2>
   GOOGLE_API_KEY=<optional>
   DATABASE_URL=<from PostgreSQL service>
   ```

4. **Add PostgreSQL**
   - New → PostgreSQL
   - Copy Internal URL to `DATABASE_URL`

5. **Note your backend URL**
   ```
   https://ai-resume-coach-backend.onrender.com
   ```

---

### Frontend on Vercel

1. **Import Project**
   - vercel.com/dashboard
   - Add Project → Select repo

2. **Configure**
   - Root Directory: `frontend`
   - Framework: `Vite`

3. **Environment Variables**
   ```
   VITE_API_BASE_URL=https://ai-resume-coach-backend.onrender.com
   ```

4. **Deploy**
   - Click Deploy
   - Wait 2-3 mins

---

## Post-Deployment (5 mins)

### 1. Test Connection

```bash
# Test backend health
curl https://ai-resume-coach-backend.onrender.com/health

# Test frontend-backend connection
# Upload resume and analyze in your Vercel URL
```

### 2. Update CORS

In `backend/main.py`, add your Vercel URL:

```python
allow_origins=[
    "https://your-app.vercel.app",
    "http://localhost:5173",
]
```

Then redeploy backend.

### 3. Verify Everything

- [ ] Frontend loads without errors
- [ ] Resume upload works
- [ ] Analysis completes successfully
- [ ] Results display correctly

---

## URLs You'll Have

| Service | Platform | URL Format |
|---------|----------|-----------|
| Backend | Render | `https://ai-resume-coach-backend.onrender.com` |
| Frontend | Vercel | `https://your-app.vercel.app` |
| Database | Render | Internal PostgreSQL |

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| 404 Frontend | Verify root directory is `frontend` in Vercel |
| 502 Backend | Check backend logs in Render dashboard |
| CORS error | Add Vercel URL to `allow_origins` in main.py |
| API calls fail | Verify `VITE_API_BASE_URL` env var in Vercel |
| Database error | Ensure `DATABASE_URL` is set in backend env vars |

---

## Environment Variables at a Glance

### Backend Render
```
AI_PROVIDER=local
JWT_EXPIRE_MINUTES=120
JWT_SECRET_KEY=<generated>
GOOGLE_API_KEY=<optional>
DATABASE_URL=<auto>
ENVIRONMENT=production
```

### Frontend Vercel
```
VITE_API_BASE_URL=https://backend-url.onrender.com
```

---

## Auto-Deploy Setup

Both services support auto-deploy on push to `main` branch.

**Check in:**
1. Render dashboard → Backend service → Settings → Auto-Deploy
2. Vercel dashboard → Project settings → Git

---

## Need Help?

📖 Full guide: See `DEPLOYMENT.md`
🔍 Backend logs: Render dashboard → Service → Logs
🔍 Frontend logs: Vercel dashboard → Deployments → Click deployment → Logs

