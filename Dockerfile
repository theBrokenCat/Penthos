# ─────────────────────────────────────────────────
#  OpenClaw Pentester — Imagen de producción
#  Para desarrollo local usa: pnpm dev en openclaw-src/
# ─────────────────────────────────────────────────
FROM node:22-slim

# ── Dependencias del sistema ──────────────────────
# Incluye: utilidades básicas + pentesting + Playwright (Chromium)
RUN apt-get update && apt-get install -y \
    # Utilidades básicas
    curl git jq \
    # Herramientas de pentesting
    nmap python3 python3-pip python3-requests \
    # Dependencias de Playwright / Chromium en Linux
    libglib2.0-0 libnss3 libnspr4 libatk1.0-0 \
    libatk-bridge2.0-0 libcups2 libdrm2 libdbus-1-3 \
    libxkbcommon0 libx11-6 libxcomposite1 libxdamage1 \
    libxext6 libxfixes3 libxrandr2 libgbm1 \
    libpango-1.0-0 libcairo2 libasound2 \
    # Chromium headless
    chromium \
    && rm -rf /var/lib/apt/lists/*

# ── pnpm via corepack ─────────────────────────────
RUN corepack enable && corepack prepare pnpm@latest --activate

# ── Build de OpenClaw ─────────────────────────────
WORKDIR /app
COPY ./openclaw-src /app/openclaw-src
WORKDIR /app/openclaw-src

# Instalar dependencias del monorepo
RUN pnpm install

# Build específico para Docker (omite canvas/UI nativo)
RUN pnpm canvas:a2ui:bundle && pnpm build:docker

# Pre-compilar TODOS los paquetes del plugin-sdk de forma secuencial.
# run-node.mjs ejecuta "pnpm recursive exec tsdown --no-clean" al arrancar
# si detecta el dist como stale. Pre-compilarlos aquí evita que 4 agentes
# hagan esa compilación en paralelo en runtime (→ OOM → SIGKILL → restart loop).
RUN pnpm --recursive --sequential exec tsdown --no-clean 2>/dev/null || true

# ── MCP Server ZAP ────────────────────────────────────────
# Compila el servidor MCP que expone ZAP REST API como tools nativos de OpenClaw
COPY ./pentester/mcp /app/pentester/mcp
WORKDIR /app/pentester/mcp
RUN npm install && npm run build

# Volver al directorio de OpenClaw
WORKDIR /app/openclaw-src

# ── Dependencias Python para las skills ──────────────────
RUN pip3 install chromadb playwright --break-system-packages
# Instalar binarios de Playwright (usa Chromium del sistema, no descarga uno nuevo)
RUN python3 -m playwright install chromium

# ── Assets del pentester ──────────────────────────
# Skills y config se montan como volumen en docker-compose
# para poder editarlos sin reconstruir la imagen.
# En producción pura, descomentar las líneas siguientes:
# COPY ./pentester/skills /app/pentester/skills
# COPY ./pentester/config/openclaw.json /root/.openclaw/openclaw.json

# ── Workspace ─────────────────────────────────────
# Montado como volumen en docker-compose (./workspace:/root/.openclaw/workspace)

EXPOSE 3000

# Entry point: mismo que pnpm start
CMD ["node", "scripts/run-node.mjs", "gateway", "--allow-unconfigured"]
