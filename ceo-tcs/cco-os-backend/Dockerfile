# ─── CCO·OS Backend — FastAPI + Gemini + SQLite ──────────────────────
# Cloud Run: listens on $PORT (8080 default), single worker, stateless.
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8080

WORKDIR /app

# OS deps — psycopg2-binary needs libpq, build tools dropped after install
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps first (better layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn

# Copy app source (incl. .env if present — see .dockerignore for gating)
COPY . .

# Seed SQLite at build time so first request has data
# Cloud Run filesystem is writable but ephemeral — DB resets per cold start
# For production switch to Cloud SQL via DATABASE_URL env var
RUN python seed_db.py || echo "seed skipped (DB already exists or error)"

# Non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8080

# Cloud Run uses $PORT — gunicorn with uvicorn worker for streaming SSE support
# Single worker keeps Gemini client singleton warm across requests
CMD exec gunicorn app.main:app \
    --bind 0.0.0.0:${PORT} \
    --workers 1 \
    --worker-class uvicorn.workers.UvicornWorker \
    --timeout 120 \
    --keep-alive 75 \
    --log-level info
