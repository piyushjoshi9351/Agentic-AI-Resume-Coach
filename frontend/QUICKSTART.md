# Frontend Quick Start

Get the React + Vite frontend running in 5 minutes.

## Prerequisites

- Node.js 16+ installed
- Backend running on http://localhost:8000

## Step 1: Install Dependencies

```bash
cd frontend
npm install
```

Takes 1-2 minutes depending on internet speed.

## Step 2: Start Development Server

```bash
npm run dev
```

You'll see:
```
  VITE v5.0.8  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

## Step 3: Open in Browser

Visit: **http://localhost:5173**

You should see the professional AI Resume Coach interface!

## What You Get

### Instant Features
✅ Drag & drop resume upload  
✅ Job description textarea  
✅ Real-time validation  
✅ Smooth animations  
✅ Progress indicator  
✅ 4-tab results view  

### Beautiful UI
✅ Dark theme (#0a0a0f background)  
✅ Purple-to-blue gradient accents  
✅ Responsive mobile/tablet/desktop  
✅ Professional SaaS look  

## Usage

1. **Drag & drop** a PDF resume (or click to upload)
2. **Paste** a job description (or use example)
3. Click **"Start AI Analysis"**
4. Wait 30-60 seconds for 4 agents to process
5. View results in 4 tabs:
   - Resume Analysis
   - Job Match (ATS score)
   - Cover Letter
   - Interview Questions

## File Structure

```
src/
├── App.jsx                  ← Main app component
├── index.css                ← Global styles & Tailwind
├── main.jsx                 ← React entry point
├── components/
│   ├── HeroHeader.jsx       ← Title + animated logo
│   ├── ResumeUpload.jsx     ← Drag & drop upload
│   ├── JobDescription.jsx   ← Textarea input
│   ├── AnalyzeButton.jsx    ← Submit button
│   ├── ProgressSteps.jsx    ← Agent progress (while loading)
│   └── ResultsTabs.jsx      ← 4 results tabs
└── services/
    └── api.js               ← Backend API calls
```

## Common Issues

### "Cannot find module react"
```bash
npm install
```

### "Backend not responding"
Start backend in another terminal:
```bash
cd backend
python main.py
```

### Changes not showing
```bash
# Restart dev server
npm run dev
```

### Port 5173 in use
```bash
npm run dev -- --port 5174
```

## Development

### Edit a Component
1. Open `src/components/HeroHeader.jsx`
2. Change something
3. Browser auto-updates instantly (HMR)

### Add a New Component
1. Create `src/components/MyComponent.jsx`
2. Import in `App.jsx`
3. Add to JSX

### Change Colors
Edit `tailwind.config.js`:
```javascript
colors: {
  purple: { glow: '#your-color' }
}
```

## Build for Production

```bash
npm run build
```

Creates optimized files in `dist/` folder (~150KB gzipped).

Deploy `dist/` to:
- Vercel
- Netlify
- Any static hosting

## Tech Stack Details

| Package | Purpose |
|---------|---------|
| React 18 | UI library |
| Vite 5 | Dev server & build tool |
| Tailwind CSS | Styling |
| Axios | API calls |
| Lucide React | Icons |

## Performance

- ⚡ Dev server: ~100ms startup
- 📦 Bundle: ~150KB gzipped
- 🎨 HMR: <100ms updates
- 🌐 No external API calls except backend

## Next Steps

1. ✅ Frontend is running
2. ✅ Backend is running
3. 📝 Customize colors/text as needed
4. 🚀 Deploy to production

## Production Deployment

### Vercel (Easiest)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Drag dist/ folder to Netlify dashboard
```

### Manual Hosting
```bash
npm run build
# Host dist/ folder on any web server
# Update API_BASE_URL for production backend
```

## Customization Tips

### Change Title
Edit `src/components/HeroHeader.jsx`:
```javascript
AI Resume & Job Coach → Your Title Here
```

### Change Colors
Edit `tailwind.config.js` or `src/index.css`

### Change API URL
Edit `src/services/api.js`:
```javascript
const API_BASE_URL = 'http://your-backend-url'
```

### Add Authentication
Wrap App with auth provider:
```javascript
<AuthProvider>
  <App />
</AuthProvider>
```

## Performance Tips

- ✅ Already optimized for production
- ✅ Tailwind purges unused CSS
- ✅ Vite code-splits automatically
- ✅ Icons are SVG (no font files)

## Help & Support

See README.md for detailed documentation.

## Enjoy! 🚀

You now have a production-grade React frontend ready for development or deployment.

Questions? Check the README.md or code comments.
