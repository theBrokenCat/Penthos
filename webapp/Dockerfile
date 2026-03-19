# ── Stage 1: Dependencias ────────────────────────────────────
FROM node:22-slim AS deps
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY src/package.json src/package-lock.json ./
RUN npm ci --legacy-peer-deps

# ── Stage 2: Build ──────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY src/ .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXTAUTH_URL=http://localhost:4000
ENV NEXTAUTH_SECRET=build-placeholder
ENV DATABASE_URL=file:/data/webapp.db

RUN npm run build

# ── Stage 3: Runner ─────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip \
    && pip3 install python-docx --break-system-packages \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN mkdir -p /data /app/generated-reports

EXPOSE 4000
ENV PORT=4000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
