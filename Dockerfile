# -------------------------------------------------------------------
# Multi-Stage Dockerfile for Bertuol Flow (Production)
# -------------------------------------------------------------------

# 1. Build Stage (Node 22 LTS)
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy application source code
COPY . .

# Build production assets (Vite frontend + PWA)
RUN npm run build

# 2. Production Runtime Stage (Node 22 LTS with native WebSocket support)
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copy built frontend assets and server file
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

# Start Bertuol Flow application
CMD ["npm", "start"]
