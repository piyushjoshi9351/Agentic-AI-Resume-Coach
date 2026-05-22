# Multi-stage Dockerfile: build frontend then run FastAPI backend

# Frontend build stage
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
COPY frontend/ ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps
RUN npm run build

# Backend runtime stage
FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1
WORKDIR /app

# System deps for psycopg2 and other builds
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
 && rm -rf /var/lib/apt/lists/*

# Copy and install Python deps
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend ./backend
# Copy test scripts into the image so smoke tests can run inside container
COPY scripts ./scripts

# Copy built frontend into backend/static (optional)
# Adjust your backend to serve static from `backend/frontend_dist` if desired
COPY --from=frontend-builder /app/frontend/dist ./backend/frontend_dist

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
