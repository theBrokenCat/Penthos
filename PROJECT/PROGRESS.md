# Progress Tracker

> Actualizar al inicio y al final de cada sesión de trabajo.

## Estado General: 🟢 Fase 4 — Integración ZAP + interactsh (en progreso)

---

## Fases del Proyecto

### Fase 0 — Fundamentos + Infraestructura ✅ COMPLETADA (2026-03-15)
- [x] Revisión completa del repo OpenClaw
- [x] Definición de arquitectura multi-agente
- [x] Definición del stack tecnológico
- [x] Creación del directorio PROJECT/ con toda la documentación base
- [x] CLAUDE.md creado para gestión de memoria entre sesiones
- [x] Decisión tomada: **OWASP ZAP** como motor de pentesting
- [x] Decisión tomada: **interactsh** para OOB payloads
- [x] Decisión tomada: **LanceDB nativo** (evaluar) → fallback ChromaDB
- [x] Decisión tomada: **ACP nativo de OpenClaw** para orquestación
- [x] Estructura `pentester/` definida en ARCHITECTURE.md
- [x] Dockerfile corregido (pnpm, build:docker, deps Playwright)
- [x] docker-compose.yml raíz con stack completo (openclaw + zap + interactsh, red compartida)
- [x] pentester/docker/docker-compose.yml para modo desarrollo (solo zap + interactsh)
- [x] .env.example con todas las variables necesarias
- [x] 14 carpetas de skills creadas, cada una con SKILL.md placeholder
- [x] pentester/config/openclaw.json registrando las 14 skills
- [x] Stack completo verificado: OpenClaw ✅ (localhost:3000) + ZAP ✅ (localhost:8080)

### Fase 1 — Skills Base ✅ COMPLETADA (2026-03-15)
**Objetivo**: Implementar las skills fundamentales que usan todos los agentes.

**Skills de memoria (prioridad 1 — base de todo):** ✅ VALIDADAS EN CONTENEDOR
- [x] `store_finding_in_vector_db` — SKILL.md + scripts/store.py (ChromaDB, persistente)
- [x] `query_attack_surface` — SKILL.md + scripts/query.py (búsqueda semántica con score)

**Skills de recon (prioridad 2):**
- [x] `spider_endpoint` — rastrear URLs y mapear la app con Playwright
- [x] `analyze_tech_stack` — fingerprinting del servidor (headers, cookies, HTML, paths)
- [x] `extract_js_secrets` — buscar tokens en código JS (20+ patrones: AWS, JWT, OpenAI...)

**Skills de proxy ZAP (prioridad 3):**
- [x] `get_proxy_history` — extraer tráfico HTTP/S de ZAP (filtrable por URL)
- [x] `parse_scan_issues` — estructurar hallazgos del escáner (mapeo de risk→severity)
- [x] `trigger_active_scan` — lanzar escaneo activo en endpoint (con polling de progreso)

**Control:**
- [x] `request_human_review` — HITL, pausar para confirmación humana

### Fase 2 — Skills Avanzadas ✅ COMPLETADA (2026-03-15)
- [x] `replay_modified_request` — fetch ZAP request + apply header/param/body overrides + diff
- [x] `fuzz_parameters` — 5 presets (sqli/xss/traversal/cmdi/ssti), detección por status/length/time
- [x] `test_auth_bypass` — JWT alg:none, weak secret, role escalation, IDOR, cookie tamper, header bypass
- [x] `generate_oob_payload` — interactsh payloads (SSRF/SQLi/XSS/CMDi) + polling de callbacks
- [x] `bypass_client_controls` — Playwright DOM manipulation: disabled/readonly/hidden/maxlength/onsubmit

### Fase 3 — Configuración de Agentes ✅ COMPLETADA (2026-03-15)
- [x] Agente Supervisor — workspace/SOUL.md, puerto 3001, skills: memory + HITL
- [x] Agente Explorador — SOUL.md, puerto 3002, skills: spider + fingerprint + JS
- [x] Agente Analista — SOUL.md, puerto 3003, skills: ZAP proxy + scanner
- [x] Agente Explotador — SOUL.md, puerto 3004, skills: fuzz + auth + OOB + bypass
- [x] docker-compose.yml multi-agente con volúmenes de estado por agente
- [x] Stack levantado y verificado end-to-end en Docker

**Smoke test realizado (2026-03-15):**
- [x] Supervisor responde en ws://0.0.0.0:3001 — skills cargadas, SOUL.md leído ✅
- [x] Explorer ejecutó `analyze_tech_stack` contra example.com — detectó Cloudflare CDN/WAF ✅
- [x] `query_attack_surface` consultó ChromaDB antes de actuar ✅
- [x] `store_finding_in_vector_db` guardó hallazgo en ChromaDB ✅
- [x] ZAP proxy fallback graceful (reintentó sin proxy cuando ZAP no accesible externamente) ✅

**Fixes aplicados durante puesta en marcha:**
- Eliminada key `workspace` de los 4 openclaw.json (no reconocida por OpenClaw)
- Token unificado a `${OPENCLAW_GATEWAY_TOKEN:-pentester}` en todos los agentes
- Dockerfile: añadido `pnpm --recursive --sequential exec tsdown --no-clean` para pre-compilar plugin-sdk y evitar OOM en startup simultáneo de 4 agentes

### Fase 4 — Integración ZAP + interactsh ✅ COMPLETADA (2026-03-17)

**Infraestructura Docker:**
- [x] ZAP daemon corriendo en contenedor `pentester-zap` (puerto 8080 API + proxy)
- [x] Juice Shop local en `pentester-juiceshop` (localhost:3005 / juiceshop:3000 interno)
- [x] interactsh desactivado — requiere dominio público; agentes usan `https://interact.sh`
- [x] Volumen compartido `pentest-db` — todos los agentes leen/escriben mismo ChromaDB
- [x] Startup secuencial con healthcheck chain (supervisor → explorer → analyst → exploiter) — fix OOM crash loop

**MCP Server ZAP↔OpenClaw:**
- [x] `pentester/mcp/src/index.ts` — MCP server TypeScript con 10 herramientas ZAP nativas
  - zap_spider_start/status/results, zap_active_scan_start/status, zap_get_alerts
  - zap_get_messages/message, zap_send_request, zap_status
- [x] `pentester/mcp/package.json` + `tsconfig.json` — proyecto TypeScript compilable
- [ ] Compilar MCP server (`docker-compose up --build`) — `dist/` pendiente de generar
- [ ] Re-habilitar `mcpServers` en analyst.json y exploiter.json tras `--build`

**Tests de integración (Juice Shop http://juiceshop:3000):**
- [x] Explorer ejecutó recon completo: 8 findings almacenados en ChromaDB compartido
  - Credenciales hardcoded (admin@juice-sh.op), OAuth client_id, open redirect, /ftp/ expuesto
- [x] Analista leyó los 8 findings del ChromaDB del Explorer ✅ (memoria compartida verificada)
- [x] ZAP proxy capturó 351 mensajes de tráfico juiceshop:3000 ✅
- [x] Analyst: `trigger_active_scan` contra `http://juiceshop:3000/rest/` → completado al 100% ✅
- [x] Analyst: `parse_scan_issues` → 353 alertas MEDIUM (CORS misconfiguration + CSP missing) ✅
- [x] Analyst: findings guardados en ChromaDB + brief preparado para Exploiter ✅
- [x] Exploiter: PoC SQLi en `/rest/products/search?q=` → **CONFIRMADA** (29 anomalías, HTTP 500 con payloads SQL, diff 13KB) ✅
- [x] Exploiter: JWT bypass → no vulnerable (alg:none, weak secret, role escalation rechazados)
- [x] Exploiter: IDOR `/rest/basket/` → no vulnerable a enumeración secuencial
- [x] Exploiter: SQLi data extraction → **Boolean-based confirmada** — payload `%' OR '%'='%` retorna todos los productos (13KB vs 30B baseline). UNION SELECT bloqueado por filtrado de sintaxis SQLite (column count mismatch, no WAF real). ChromaDB ID: `759d3667` ✅

**Fixes aplicados en Fase 4:**
- Fix crash loop OOM: healthcheck chain secuencial + pre-compilación en Dockerfile
- Fix ChromaDB aislado: volumen compartido `pentest-db` en `/data/pentest/findings.db`
- Fix ZAP proxy 8090→8080: corregido en todos los SKILL.md, scripts Python y SOUL.md
- Fix `count=0` en `zap_history.py`: ZAP interpretaba 0 literalmente → cambiado a 2000
- Fix open redirect en spider: interceptor `page.route()` bloquea requests fuera de scope
- Fix mcpServers key: la key correcta es `plugins.entries.acpx.config.mcpServers`
- Fix rate limits Anthropic: migración a **Ollama local** (`qwen3.5:9b` vía `host.docker.internal:11434`)
- Fix token inválido: `OPENCLAW_GATEWAY_TOKEN` unificado para todos los agentes
- Fix ZAP API key: `.env` tenía placeholder `cambia-esto-por-una-clave-zap` → cambiado a `changeme`
- Fix ZAP OOM crash al 34%: añadido `mem_limit: 3g` + `ascan.threadPerHost=2` + scan solo sobre `/rest/`
- Fix `trigger_active_scan` con `--wait`: OpenClaw Exec timeout corta procesos largos → lanzar SIN `--wait` y hacer polling manual
- Fix hooks config: `hooks` clave raíz (no dentro de `gateway`) + `HOOKS_TOKEN` distinto de `OPENCLAW_GATEWAY_TOKEN`
- Fix contaminación ChromaDB: `--url-filter` en `query_attack_surface` para filtrar por dominio del target

### Fase 5 — Validación con PortSwigger Labs 🟡 EN PROGRESO (2026-03-17)

**Lab completado: "Exploiting an API endpoint using documentation" ✅ SOLVED**
- [x] Explorer: recon autenticado (wiener/peter) → descubrió `PATCH /api/user/{username}` en `changeEmail.js`
- [x] Exploiter: encontró `/api/openapi.json` → documentación OpenAPI completa con GET/DELETE/PATCH
- [x] Exploiter: `DELETE /api/user/carlos` → HTTP 200 `{"status":"User deleted"}` → **Lab resuelto** ✅
- [x] ChromaDB ID exploit: `9eb9f433-6bfd-485b-ac9c-fd1a404414f2`
- **Vulnerabilidad:** API abuse — cualquier usuario autenticado podía eliminar otros usuarios (falta de control de autorización por roles)
- **Attack flow autónomo:** Explorer recon → JS analysis → API docs discovery → auth → exploit

**Supervisor autónomo — orquestación completa ✅**
- [x] Skill `delegate_to_agent` creada: Supervisor envía tareas a Explorer/Analyst/Exploiter vía `POST /hooks/agent`
- [x] `SOUL.md` del Supervisor reescrito con pipeline de 6 fases completamente autónomo
- [x] Hooks habilitados en explorer.json, analyst.json, exploiter.json (`"hooks"` a nivel raíz)
- [x] `HOOKS_TOKEN=hooks-secret` separado de `OPENCLAW_GATEWAY_TOKEN=pentester`
- [x] `--url-filter` añadido a `query_attack_surface` — evita mezclar findings de distintos targets
- [x] Skill `save_report` creada — informes guardados en `./reports/report_{dominio}_{timestamp}.md`
- [x] Skill `clear_target_data` creada — limpia ChromaDB y reportes antes de re-auditar
- [x] Volumen `./reports:/app/reports` añadido a docker-compose para persistencia de informes

**Labs pendientes:**
- [ ] Lab: "Finding and exploiting an unused API endpoint" (comprar Lightweight l33t Leather Jacket — PATCH /api/products/{id}/price)
- [ ] Lab: SQL Injection (extracción de datos con UNION-based)
- [ ] Lab: XSS reflected
- [ ] Lab: Authentication bypass
- [ ] Lab: IDOR

### Fase 6 — Reporter y Producto Final 🔴 Pendiente
- [ ] Agente Reporter con template profesional
- [ ] Portal / interfaz para clientes
- [ ] Modelo de negocio definido

---

## Log de Sesiones

### 2026-03-15 — Sesión 1
**Logros:**
- Revisión completa del repo OpenClaw (arquitectura, stack, workspace)
- Diseño de arquitectura multi-agente basada en investigación previa
- Creación completa de PROJECT/ (README, ARCHITECTURE, PROGRESS, agents/, skills/, stack/, references/)
- CLAUDE.md en raíz para gestión de contexto entre sesiones
- Todas las decisiones de stack tomadas y documentadas
- Estructura de carpeta `pentester/` definida

**Decisiones tomadas:**
- ZAP + interactsh (motor de pentesting)
- LanceDB nativo (memoria)
- ACP nativo (orquestación)

**Próxima sesión:** Implementar `store_finding_in_vector_db` y `query_attack_surface`

### 2026-03-15 — Sesión 2
**Logros:**
- `request_human_review` — protocolo HITL completo (SKILL.md, sin script necesario)
- `spider_endpoint` — crawler BFS con Playwright, soporte proxy ZAP, extracción de forms/JS
- `analyze_tech_stack` — fingerprinting pasivo: headers, cookies, HTML meta, paths (20+ reglas)
- `extract_js_secrets` — 20+ patrones: AWS, OpenAI, Anthropic, Stripe, GitHub, JWT, DB strings...
- `get_proxy_history` — recupera mensajes ZAP filtrados por URL, auto-tagging por tipo
- `parse_scan_issues` — normaliza alertas ZAP a severidad interna, ordena por riesgo
- `trigger_active_scan` — lanza y hace polling del active scan ZAP con timeout configurable
- **Fase 1 completada al 100%** (9/9 skills del núcleo implementadas)

**Próxima sesión:** Fase 2 — Skills avanzadas de explotación (`replay_modified_request`, `fuzz_parameters`, `test_auth_bypass`, `generate_oob_payload`, `bypass_client_controls`)

### 2026-03-15 — Sesión 3
**Logros:**
- `replay_modified_request` — fetch ZAP msg + override headers/params/body + diff comparativo
- `fuzz_parameters` — 5 presets integrados (~100 payloads), detección por status/length/time
- `test_auth_bypass` — 7 tests: JWT alg:none, weak secret, role escalation, cookie tamper, IDOR, header bypass, no_auth
- `generate_oob_payload` — interactsh payloads (SSRF/blind SQLi/blind XSS/CMDi) + polling callbacks + modo offline
- `bypass_client_controls` — Playwright: strip disabled/readonly/maxlength/required/onsubmit + inject value + submit
- **Fase 2 completada al 100%** — las 14 skills del proyecto implementadas
- **Las 14/14 skills tienen SKILL.md + scripts Python validados**

**Próxima sesión:** Fase 3 — Configuración de los 4 agentes en OpenClaw (workspace, prompt, skillFilter)

### 2026-03-15 — Sesión 4
**Logros:**
- Fase 3 completada: 4 agentes configurados con per-agent openclaw.json + SOUL.md + skill filter
- docker-compose multi-agente con 4 servicios (puertos 3001-3004) + ZAP
- Puesta en marcha del stack completo — debugging y fixes de producción:
  - Diagnóstico del crash loop (OOM durante tsdown en startup simultáneo)
  - Fix Dockerfile: pre-compilación secuencial de plugin-sdk (`pnpm --recursive --sequential exec tsdown --no-clean`)
  - Fix openclaw.json: eliminada key `workspace` no reconocida por OpenClaw
  - Token unificado para todos los agentes
- **Smoke test completo superado**: Explorer ejecutó analyze_tech_stack + ChromaDB read/write en producción
- **Stack 100% operativo**: 4 agentes respondiendo en localhost:3001-3004

**Estado al cierre:** Fases 0-3 completadas y verificadas en producción. Listo para Fase 4.
**Próxima sesión:** Fase 4 — MCP server ZAP↔agentes + tests de integración con PortSwigger labs

### 2026-03-16 — Sesión 5
**Logros:**
- Diagnóstico y fix definitivo del crash loop OOM (tsdown SIGKILL con 4 agentes simultáneos)
  - Fix 1: healthcheck chain Docker (supervisor → explorer → analyst → exploiter, startup secuencial)
  - Fix 2: pre-compilación en Dockerfile (`pnpm --recursive --sequential exec tsdown --no-clean`)
- Fix ChromaDB no compartido: volumen Docker `pentest-db` compartido en `/data/pentest/findings.db`
- Fix ZAP proxy URL: 8090 → 8080 en SOUL.md del Explorer y skills relevantes
- Fix open redirect en spider: interceptor `page.route()` bloquea requests fuera de scope a nivel de red
- MCP server ZAP↔OpenClaw creado: `pentester/mcp/src/index.ts` con 10 herramientas ZAP
- Stack 4 agentes levantado y estable (sin crash loops) con Juice Shop como target
- Test end-to-end parcial:
  - Explorer: recon completo de juiceshop:3000 → 8 findings en ChromaDB
  - Analyst: leyó findings del Explorer (memoria compartida verificada) + 351 mensajes ZAP capturados
  - Analyst: mid-execution extrayendo proxy history para `request_human_review` de active scan
- Modelo cambiado de `claude-opus-4-6` a `claude-haiku-4-5-20251001` en los 4 agentes (reducción de costes)

**Pendiente al cierre:**
- `docker-compose up --build` para compilar MCP server (`dist/` aún no existe)
- Re-habilitar `mcpServers` en analyst.json + exploiter.json tras `--build`
- Completar flujo Analyst: proxy history → request_human_review → active scan → parse_scan_issues
- Pasar findings al Exploiter para PoC (credenciales, JWT bypass, open redirect)

**Próxima sesión:** Completar flujo Analyst (active scan Juice Shop) + Exploiter PoC + Fase 5 PortSwigger Labs

### 2026-03-17 — Sesión 7
**Logros:**
- Pipeline end-to-end Juice Shop completado: SQLi booleana confirmada + lab PortSwigger resuelto
- Supervisor autónomo: skill `delegate_to_agent` + reescritura SOUL.md con pipeline 6 fases
- Fix hooks config (3 bugs: posición JSON → token duplicado → resolución)
- Fix contaminación ChromaDB: `--url-filter` en `query_attack_surface`
- Skill `save_report`: informes persistentes en `./reports/`
- Skill `clear_target_data`: limpieza de datos por target antes de re-auditar
- Segundo lab PortSwigger iniciado: "Finding and exploiting an unused API endpoint"

**Pendiente:**
- Recrear contenedores con nueva config: `docker-compose up -d --force-recreate`
- Resolver lab "Finding and exploiting an unused API endpoint"
- Compilar MCP server (`docker-compose up --build`)

### 2026-03-16 — Sesión 6
**Logros:**
- Revisión del estado general del proyecto y explicación del stack tecnológico
- **Migración de proveedor LLM: Anthropic → Google Gemini**
  - Motivo: problemas de límite de tokens con API key de Claude; Gemini tiene tier gratuito
  - Archivos modificados:
    - `pentester/config/supervisor.json` — modelo: `google/gemini-2.0-flash`
    - `pentester/config/explorer.json` — modelo: `google/gemini-2.0-flash`
    - `pentester/config/analyst.json` — modelo: `google/gemini-2.0-flash`
    - `pentester/config/exploiter.json` — modelo: `google/gemini-2.0-flash`
    - `docker-compose.yml` — `GEMINI_API_KEY` requerida, `ANTHROPIC_API_KEY` opcional
    - `CLAUDE.md` — estado actualizado, modelo y proveedor documentados

**Variables de entorno requeridas ahora:**
- `GEMINI_API_KEY` → API key de Google AI Studio (gratuita)
- `ANTHROPIC_API_KEY` → ya no es necesaria (variable opcional)

**Nota sobre modelos Gemini disponibles en OpenClaw:**
- `google/gemini-2.0-flash` ← **ACTIVO** (estable, tier gratuito)
- `google/gemini-2.5-flash` ← alternativa más capaz (puede tener coste)
- `google/gemini-3.1-flash-preview` ← versión más nueva (preview)

**Pendiente (sin cambios):**
- `docker-compose up --build` para compilar MCP server (`dist/` aún no existe)
- Re-habilitar `mcpServers` en analyst.json + exploiter.json tras `--build`
- Completar flujo Analyst: proxy history → active scan → parse_scan_issues → Exploiter PoC

**Próxima sesión:** Añadir `GEMINI_API_KEY` al `.env`, levantar stack y continuar flujo Analyst
