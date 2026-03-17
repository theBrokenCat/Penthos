# Arquitectura Técnica

> Última actualización: 2026-03-15 — Decisiones de stack confirmadas.

---

## Stack Core (DEFINITIVO)

### Plataforma de Agentes
- **OpenClaw** como base (gateway, multi-canal, skills system, memoria, ACP)
- **ACP (Agent Control Protocol)** nativo de OpenClaw para orquestación multi-agente
- ❌ ~~CrewAI / AutoGen~~ — descartado (Python vs TypeScript, fricción innecesaria)

### Interacción Web
- **Playwright** — ya integrado en OpenClaw, navegación real con JS completo
- ❌ ~~Puppeteer~~ — descartado, Playwright es superior y ya está

### Motor de Pentesting
- **OWASP ZAP** en modo daemon vía **REST API**
- **interactsh** (ProjectDiscovery) para payloads Out-of-Band (OOB)
- Integración vía **MCP** desde OpenClaw hacia ZAP
- ❌ ~~Burp Suite Enterprise~~ — descartado por coste (sin licencia)
- Migración futura a Burp Suite cuando haya clientes reales

### Memoria Compartida
- **LanceDB** nativo de OpenClaw — evaluar capacidad multi-agente en Fase 1
- Fallback: **ChromaDB** en Docker si LanceDB no soporta acceso concurrente
- ❌ ~~Pinecone / pgvector~~ — deferido a escala de producción

### Glue e Integración
- **MCP (Model Context Protocol)** para exponer herramientas ZAP a los agentes
- TypeScript/ESM puro — sin Python en el stack core

---

## Agentes y Responsabilidades

### 1. Agente Supervisor (Orquestador)
- Mantiene el contexto global de la auditoría
- Asigna tareas a los agentes especializados
- Evita duplicación de ataques (consulta memoria compartida)
- Consolida hallazgos para el reporter
- Activa HITL en puntos críticos
- **Skills**: `query_attack_surface`, `store_finding_in_vector_db`, `request_human_review`

### 2. Agente Explorador (Spidering)
- Navega la aplicación: links, clics, formularios, rutas dinámicas
- Gestiona sesiones continuas (cookies, auth tokens)
- Mapea superficie de ataque completa
- **Skills**: `spider_endpoint`, `analyze_tech_stack`, `extract_js_secrets`, `store_finding_in_vector_db`

### 3. Agente Analista de Tráfico
- Monitorea el proxy ZAP (historial HTTP/S)
- Detecta anomalías y puntos de inyección
- Lanza escaneos activos en endpoints prometedores
- **Skills**: `get_proxy_history`, `parse_scan_issues`, `trigger_active_scan`, `store_finding_in_vector_db`

### 4. Agente Explotador
- Recibe puntos de inyección del Analista
- Genera y prueba payloads específicos (XSS, SQLi, IDOR, JWT, etc.)
- Confirma explotabilidad con PoC mínimo
- **Skills**: `replay_modified_request`, `fuzz_parameters`, `test_auth_bypass`, `generate_oob_payload`, `bypass_client_controls`, `store_finding_in_vector_db`, `request_human_review`

### 5. Agente Reporter *(Fase 6 — futuro)*
- Consolida hallazgos del supervisor
- Genera informe profesional: severidad, PoC, recomendaciones
- Formatos: PDF, Markdown, DOCX

---

## Flujo de Datos

```
[Input: URL + Scope + Credenciales opcionales]
              ↓
     [Supervisor]
     Crea plan, inicializa sesión en LanceDB
              ↓
       ┌──────┴──────┐
  [Explorador]   [Analista]          ← corren en paralelo
  spider, mapea  revisa proxy ZAP
  endpoints      detecta issues
       └──────┬──────┘
              ↓ guarda en LanceDB
     [Explotador]
     Recibe issues del Analista
     Genera payloads → confirma vulns
     Guarda PoC en LanceDB
              ↓
     [Supervisor]
     Consolida, deduplica, evalúa cobertura
     Si hay gaps → reasigna tareas
              ↓
     [Reporter] ← Fase futura
     Genera informe profesional
```

---

## Integración con OpenClaw

**Lo que OpenClaw ya provee (no construir):**
- Gateway HTTP + routing de mensajes
- Skills system (cada tool del agente = un skill)
- ACP para coordinar agentes entre sí
- Playwright para browser automation
- LanceDB para memoria vectorial
- Workspace (SOUL.md, AGENTS.md) para contexto persistente
- Multi-canal: recibir peticiones por Slack, Telegram, CLI

**Lo que hay que construir encima de OpenClaw:**

```
pentester/
├── skills/           ← Las 14 skills (TypeScript)
├── agents/           ← Configuración de los 4 agentes
├── mcp/              ← MCP server que expone ZAP REST API
├── workspace/        ← SOUL.md, AGENTS.md específicos de pentesting
└── docker/           ← ZAP daemon + interactsh
```

---

## Infraestructura de Ejecución

```
Docker Compose
├── openclaw          ← Gateway + agentes (Node.js 22)
├── zap               ← OWASP ZAP en modo daemon (puerto 8080)
└── interactsh        ← Servidor OOB para payloads fuera de banda
```

---

## Decisiones Resueltas ✅

| Decisión | Elección | Razón |
|---|---|---|
| Motor de pentesting | **OWASP ZAP** | Open-source, API REST completa, sin coste |
| OOB payloads | **interactsh** | Alternativa open-source a Burp Collaborator |
| Vector DB | **LanceDB** (evaluar) | Ya en OpenClaw, sin complejidad extra |
| Orquestación | **ACP nativo** | TypeScript puro, sin fricción de ecosistema |

## Decisiones Pendientes

- [ ] ¿Cómo exponer el servicio a clientes? (portal web, bot de Slack, API pública)
- [ ] ¿Estructura de carpeta `pentester/` dentro del repo o repo separado?
