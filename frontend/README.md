# AI Resume & Job Coach - Frontend

A production-grade React + Vite + Tailwind CSS frontend for intelligent resume analysis and career coaching.

## Project Overview

Modern, responsive SaaS-style UI with:
- Dark theme with purple-to-blue gradient accents
- Smooth animations and transitions
- 4-tab results interface
- Real-time progress tracking
- Professional design comparable to $10K+ SaaS products

## Tech Stack

- **React 18** - UI library
- **Vite** - Modern build tool
- **Tailwind CSS** - Utility-first CSS
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **React Markdown** - Markdown rendering

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── HeroHeader.jsx
│   │   ├── ResumeUpload.jsx
│   │   ├── JobDescription.jsx
│   │   ├── AnalyzeButton.jsx
│   │   ├── ProgressSteps.jsx
│   │   └── ResultsTabs.jsx
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── index.html
└── README.md
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The frontend will be available at: **http://localhost:5173**

### 3. Build for Production

```bash
npm run build
```

The compiled files will be in the `dist/` folder.

## Features

### Hero Section
- Animated gradient logo with Brain + Sparkle icons
- Main title and subtitle
- 4 agent badges with gradient colors
- Animated entry effects

### Input Section (2-Column Layout)
**Resume Upload:**
- Drag & drop zone with dashed purple border
- File upload with validation
- Shows file name and size after upload
- Green checkmark on success
- Remove button to clear selection

**Job Description:**
- Dark textarea with purple focus glow
- Real-time character counter (0-5000)
- Placeholder with example text
- Error validation messages

### Analyze Button
- Full-width with purple-to-blue gradient
- Sparkle icon with text
- Pulse animation when ready
- Disabled state during analysis
- Loading state with spinner
- Helpful status messages

### Agent Progress (During Loading)
- 4-step animated progress
- Icons for each agent
- Status: waiting → working → done
- Auto-advances every 3 seconds
- Shows animated dots during processing

### Results Section (4 Tabs)

**Tab 1 - Resume Analysis:**
- Technical skills (purple chip badges)
- Soft skills (blue chip badges)
- Work experience with achievements
- Strengths with evidence
- Areas to improve with recommendations

**Tab 2 - Job Match:**
- Large circular ATS score (0-100)
- Score color: green (>70%), yellow (40-70%), red (<40%)
- Matching skills (green chips)
- Missing skills with recommendations
- Overall recommendation badge

**Tab 3 - Cover Letter:**
- Clean, readable text display
- Copy to clipboard button (shows "Copied!" feedback)
- Download as .txt button
- Professional formatting

**Tab 4 - Interview Prep:**
- 8 accordion-style questions
- Numbered 1-8 with gradient circles
- Each question expandable
- Shows: framework, strong answer, key points, tips
- Type badge (Technical, Behavioral, Role-specific, Tricky)

## Design System

### Colors
- **Background:** `#0a0a0f` (dark-bg)
- **Cards:** `#12121a` (dark-card)
- **Borders:** `#1a1a25` (dark-border)
- **Text:** `#e4e4e7` (dark-text)
- **Muted:** `#71717a` (dark-muted)
- **Accent:** Purple to Blue gradient (`#7c3aed` → `#2563eb`)

### Typography
- **Font:** Inter (from Google Fonts)
- **Sizes:** Responsive across mobile/tablet/desktop
- **Weights:** 300-800

### Animations
- Fade in/out
- Slide up/down
- Pulse and glow effects
- Smooth transitions (300ms default)
- Staggered delays for hero elements

## API Integration

### Endpoints Used
- **POST /analyze** - Main analysis endpoint
  - Accepts: resume (PDF file) + job_description (text)
  - Returns: resume_analysis, job_match, cover_letter, interview_questions

- **GET /health** - Health check
  - Used to verify backend availability on mount

### Request Format
```javascript
const formData = new FormData()
formData.append('resume', resumePdfFile)
formData.append('job_description', jobDescriptionText)

const response = await axios.post('http://localhost:8000/analyze', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
```

### Error Handling
- Network error detection
- Server error handling
- User-friendly error messages
- Backend availability check

## Responsive Design

### Mobile (< 640px)
- Single column layout
- Adjusted font sizes
- Stacked components
- Touch-friendly buttons
- Hidden text labels with abbreviations

### Tablet (640px - 1024px)
- 2-column grid where appropriate
- Optimized spacing

### Desktop (> 1024px)
- Full 2-column input section
- All features visible
- Optimized for 7:5 aspect ratio

## Customization

### Change Colors
Edit `tailwind.config.js`:
```javascript
colors: {
  purple: { glow: '#new-color' },
  blue: { glow: '#new-color' }
}
```

### Change Accent Colors
Edit `src/index.css`:
```css
.gradient-purple-blue {
  background: linear-gradient(135deg, #color1 0%, #color2 100%);
}
```

### Adjust Animations
Edit `tailwind.config.js` keyframes section

### Change API URL
Edit `src/services/api.js`:
```javascript
const API_BASE_URL = 'http://your-backend-url'
```

## Performance Considerations

- **Lazy loading** of components (React.lazy available)
- **Code splitting** by route
- **CSS optimization** via Tailwind
- **Image optimization** (none currently, can add with image CDN)
- **Bundle size:** ~150KB gzipped

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Requires ES2020+ JavaScript support.

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Drag dist/ folder to Netlify
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

## Environment Variables

Currently none required. Backend URL is hardcoded to `http://localhost:8000`.

To make configurable:
1. Create `.env.local` file
2. Add: `VITE_API_URL=http://localhost:8000`
3. Update `api.js`: `const API_BASE_URL = import.meta.env.VITE_API_URL`

## Development Tips

### Hot Module Replacement (HMR)
- Edit a component and changes appear instantly
- State is preserved during development

### Debugging
- Use React DevTools browser extension
- Check Network tab for API calls
- Console logs are shown in terminal

### Testing Components
- Import components into App.jsx
- Edit tailwind.config.js for color testing
- Use browser DevTools for responsive design testing

## Performance Optimization

Already implemented:
- ✅ Lazy component rendering (Progress, Results)
- ✅ Debounced API calls
- ✅ Efficient re-renders with useState
- ✅ CSS optimization with Tailwind
- ✅ SVG icons (Lucide React)

Potential optimizations:
- Add React.memo() for static components
- Implement virtualization for long lists
- Use useCallback() for event handlers
- Implement service worker caching

## Troubleshooting

### Port 5173 Already in Use
```bash
npm run dev -- --port 5174
```

### Backend Not Responding
- Ensure backend is running: `cd ../backend && python main.py`
- Check http://localhost:8000/health
- Check CORS configuration in backend

### Styles Not Applying
- Restart dev server: `npm run dev`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check Tailwind content paths in tailwind.config.js

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

## License

Proprietary - All rights reserved

## Support

For issues or questions, refer to the main project README or backend documentation.
