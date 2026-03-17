# Cambios de Infraestructura Docker

## 2026-03-15 — Dockerfile: pre-compilación secuencial de plugin-sdk

**Qué:** Añadida línea al Dockerfile para pre-compilar todos los paquetes plugin-sdk de OpenClaw durante el build de la imagen:
```dockerfile
RUN pnpm --recursive --sequential exec tsdown --no-clean 2>/dev/null || true
```
**Por qué:** Al arrancar 4 contenedores simultáneamente, cada uno intentaba compilar los paquetes TypeScript. Con ~7.6GB RAM asignados a Docker y 4 builds paralelos → OOM → SIGKILL → bucle de reinicios (40+ reinicios por contenedor).
**Efecto:** Los paquetes ya vienen compilados en la imagen. Cada agente solo recompila lo que cambia, no todo.
**Archivos:** `Dockerfile`

---

## 2026-03-16 — docker-compose: healthcheck chain (startup secuencial)

**Qué:** Añadida cadena de dependencias con healthcheck entre agentes:
```yaml
supervisor:
  healthcheck: ...
explorer:
  depends_on:
    supervisor: { condition: service_healthy }
analyst:
  depends_on:
    explorer: { condition: service_healthy }
exploiter:
  depends_on:
    analyst: { condition: service_healthy }
```
**Por qué:** Fix complementario al Dockerfile. Garantiza que solo un agente compila sus dependencias a la vez, eliminando el OOM por completo incluso si el Dockerfile falla.
**Efecto:** Startup completamente secuencial y estable. Tarda ~2-3 min más en arrancar pero no hay crashes.
**Archivos:** `docker-compose.yml` (raíz)

---

## 2026-03-16 — docker-compose: volumen compartido pentest-db

**Qué:** Añadido volumen Docker nombrado `pentest-db` montado en `/data/pentest/` en todos los agentes. Variable de entorno `PENTEST_DB_PATH=/data/pentest/findings.db`.
**Por qué:** Cada agente tenía su propio volumen para `/root/.openclaw`. El Analyst consultaba un ChromaDB vacío aunque el Explorer había guardado 8 findings.
**Efecto:** Todos los agentes leen y escriben en el mismo ChromaDB. Memoria compartida verificada en producción.
**Archivos:** `docker-compose.yml` (raíz)

---

## 2026-03-16 — docker-compose: Juice Shop como servicio

**Qué:** Añadido servicio `juiceshop` con imagen `bkimminich/juice-shop:latest` expuesto en `localhost:3005` (host) / `juiceshop:3000` (red Docker interna).
**Por qué:** Target de pentesting local para pruebas end-to-end sin depender de labs externos.
**Efecto:** Los agentes acceden al target via `http://juiceshop:3000` dentro de la red Docker.
**Archivos:** `docker-compose.yml` (raíz)

---

## 2026-03-16 — docker-compose: ZAP proxy en 8080

**Qué:** Añadidos flags a la command de ZAP: `-config proxy.ip=0.0.0.0 -config proxy.port=8080`
**Por qué:** ZAP por defecto escucha en localhost. Con `proxy.ip=0.0.0.0` escucha en todas las interfaces de la red Docker, accesible desde todos los contenedores.
**Efecto:** Los agentes pueden enrutar tráfico Playwright a través de `http://zap:8080` y ZAP captura todos los requests.
**Archivos:** `docker-compose.yml` (raíz)

---

## 2026-03-16 — docker-compose: interactsh desactivado

**Qué:** Servicio `interactsh` comentado/desactivado. Los agentes usan el servidor público `https://interact.sh`.
**Por qué:** `interactsh` en modo self-hosted requiere un dominio público para DNS callbacks (`[FTL] No domains specified`). Sin dominio público, el servicio crasha en bucle.
**Efecto:** Las skills de OOB payload (`generate_oob_payload`) usan el servidor público de ProjectDiscovery. Funcional para tests, no recomendado para auditorías reales (tráfico pasa por servidor externo).
**Archivos:** `docker-compose.yml` (raíz)

---

## 2026-03-16 — Fix .env: ZAP_API_KEY placeholder

**Qué:** Cambiado `ZAP_API_KEY=cambia-esto-por-una-clave-zap` → `ZAP_API_KEY=changeme` en `.env`
**Por qué:** El `.env` se creó copiando `.env.example` sin rellenar el valor de `ZAP_API_KEY`. Docker Compose expandía `${ZAP_API_KEY:-changeme}` al valor del `.env` (`cambia-esto-por-una-clave-zap`), así que ZAP arrancaba con esa clave. Todos los scripts y agentes enviaban `apikey=changeme` → ZAP lo rechazaba con "API key incorrect". El volumen `pentester-zap-data` persistía la clave errónea entre reinicios, haciendo que el problema reapareciera.
**Síntomas:** `curl: (52) Empty reply from server` desde el host, "Cannot connect to ZAP" desde los agentes.
**Efecto:** ZAP acepta requests con `apikey=changeme`. Requiere `docker-compose up -d --force-recreate zap` para que tome efecto.
**Archivos:** `.env`

---

## 2026-03-16 — Dockerfile: build del MCP server

**Qué:** Añadido step al Dockerfile para compilar el MCP server TypeScript:
```dockerfile
COPY ./pentester/mcp /app/pentester/mcp
RUN cd /app/pentester/mcp && npm install && npm run build
```
**Por qué:** El MCP server necesita estar compilado (`dist/index.js`) para que los agentes puedan ejecutarlo.
**Efecto:** Tras `docker-compose up --build`, el MCP server está disponible en `/app/pentester/mcp/dist/index.js`
**Archivos:** `Dockerfile`
**Nota:** Requiere `--build` para activarse. Sin `--build`, el `dist/` no existe y los agentes no pueden usarlo.
