# ─── CCO·OS Frontend — Vite (React) + nginx ──────────────────────────
# Multi-stage: build with node, serve static with nginx.
# Backend URL injected at runtime via env var (not baked at build).

# ── Stage 1: Build ───────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Cache deps layer.
# Use npm install (not npm ci) since package-lock.json may not exist.
# If you commit package-lock.json later, swap back to: npm ci --no-audit --no-fund
COPY package*.json ./
RUN npm install --no-audit --no-fund

# Copy source incl. .env (user requested)
COPY . .

# Build-time backend URL — overridable via --build-arg VITE_API_BASE_URL=...
# At runtime we still allow override via window.__ENV__ (see entrypoint.sh)
ARG VITE_API_BASE_URL=__RUNTIME_BACKEND_URL__
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build


# ── Stage 2: Serve ───────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Tools for runtime env substitution
RUN apk add --no-cache bash gettext

# nginx config: SPA fallback + Cloud Run $PORT support
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Built static assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Entrypoint substitutes backend URL into built bundle at container start
COPY docker-entrypoint.sh /docker-entrypoint.d/40-runtime-env.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-env.sh

# Cloud Run injects $PORT (8080). Default exposed for local docker run.
ENV PORT=8080
EXPOSE 8080

# nginx official image already has an entrypoint that runs envsubst on
# /etc/nginx/templates/*.template and then execs nginx. Just keep that.
CMD ["nginx", "-g", "daemon off;"]
