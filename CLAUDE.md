# CLAUDE.md — Guía de Sesión: OpenClaw Pentester

> **Leer SIEMPRE al inicio de cada sesión.** Este archivo es el mapa completo del proyecto.

---

## 1. ¿Qué es este proyecto?

Plataforma de pentesting web autónoma sobre **OpenClaw**. Cuatro agentes colaborativos especializados (Supervisor, Explorador, Analista, Explotador) que coordinan para auditar aplicaciones web. Objetivo final: core tecnológico de una consultora de ciberseguridad.

---

## 2. Estado actual

| Campo | Valor |
|---|---|
| **Fase activa** | 5 — Validación con PortSwigger Labs (en progreso) + Fase 6 Portal Web ✅ |
| **Última sesión** | 2026-03-18 |
| **Proveedor LLM** | ☁️ **Anthropic API** |
| **Modelo activo** | `claude-haiku-4-5-20251001` (todos los agentes) |
| **Portal web** | Next.js 15 en `webapp/` — puerto 4000 — admin: salvadormayorarturo@gmail.com |
| **Alternativas** | ollama=`ollama/qwen3.5:9b` (ver `PROJECT/changes/models.md`) \| gemini=`google/gemini-2.0-flash` |
| **Próximo paso** | Lab: "Finding and exploiting an unused API endpoint" (PATCH precio → comprar Leather Jacket) — Portal web: `cd webapp/src && npx next dev -p 4000` |

Ver detalle completo en `PROJECT/PROGRESS.md`.

---

## 2b. Cómo arrancar el entorno

### Modo desarrollo (recomendado para iterar rápido)
```bash
# 1. Levantar ZAP + interactsh
cd pentester/docker && docker-compose up -d

# 2. Levantar OpenClaw nativo (en otra terminal)
cd openclaw-src
pnpm install        # solo la primera vez
pnpm dev            # arranca el gateway en localhost:3000
```

### Modo producción / stack completo
```bash
# Copia .env.example → .env y rellena tus claves
cp .env.example .env

# Levanta todo (OpenClaw + ZAP + interactsh)
docker-compose up --build
```

### Puertos del stack
| Servicio | Puerto | Para qué |
|---|---|---|
| OpenClaw gateway | 3000 | API del agente |
| ZAP API REST | 8080 | Skills de proxy |
| ZAP proxy HTTP | 8090 | Tráfico Playwright → ZAP |
| interactsh | 8443 | Callbacks OOB |

---

## 3. Stack definitivo (NO cambiar sin razón documentada)

| Capa | Tecnología |
|---|---|
| Plataforma de agentes | **OpenClaw** (Node.js 22, TypeScript ESM, pnpm) |
| Orquestación multi-agente | **ACP nativo de OpenClaw** |
| Browser | **Playwright** (ya en OpenClaw) |
| Proxy / Scanner | **OWASP ZAP** daemon, REST API, puerto 8080 |
| OOB payloads | **interactsh** (ProjectDiscovery), puerto 8443 |
| Memoria compartida | **ChromaDB** en volumen Docker compartido (`pentest-db`) |
| Integración ZAP↔agentes | **MCP** (Model Context Protocol) |
| **LLM proveedor** | **Ollama local** (Mac host vía `host.docker.internal:11434`) |
| **LLM modelo** | `ollama/qwen3.5:9b` — todos los agentes |
| **Alternativas guardadas** | `claude-haiku-4-5-20251001` / `google/gemini-2.0-flash` (ver `_note_alternatives` en cada config JSON) |

---

## 4. Mapa de directorios

```
openclaw-pentester/
│
├── CLAUDE.md                        ← 👈 ESTE ARCHIVO — leer al inicio
│
├── PROJECT/                         ← 📚 CONOCIMIENTO (docs, no código)
│   ├── README.md                    ← visión general del proyecto
│   ├── ARCHITECTURE.md              ← arquitectura completa y stack
│   ├── PROGRESS.md                  ← estado por fases ← ACTUALIZAR SIEMPRE
│   ├── agents/                      ← spec de cada agente (rol, skills, prompt)
│   │   ├── supervisor.md
│   │   ├── explorer.md
│   │   ├── analyst.md
│   │   └── exploiter.md
│   ├── skills/                      ← documentación de las 14 skills
│   │   └── index.md                 ← tabla resumen de todas las skills
│   ├── stack/
│   │   └── decisions.md             ← decisiones tecnológicas justificadas
│   ├── references/
│   │   └── repos.md                 ← repos de GitHub de referencia
│   └── sessions/                    ← logs de sesiones con Claude (YYYY-MM-DD.md)
│
├── pentester/                       ← 🔧 CÓDIGO FUENTE (construir aquí)
│   │
│   ├── skills/                      ← LAS 14 SKILLS DE LOS AGENTES
│   │   │   ⚠️  Cada skill = una subcarpeta con SKILL.md + scripts/
│   │   │   ⚠️  Las skills NO son TypeScript puro — son SKILL.md con
│   │   │       instrucciones en markdown y scripts auxiliares (Python/Bash)
│   │   │
│   │   ├── store_finding_in_vector_db/
│   │   │   ├── SKILL.md             ← definición + instrucciones al agente
│   │   │   └── scripts/             ← helpers Python/Bash opcionales
│   │   ├── query_attack_surface/    ← igual para cada skill...
│   │   ├── request_human_review/
│   │   ├── spider_endpoint/
│   │   ├── analyze_tech_stack/
│   │   ├── extract_js_secrets/
│   │   ├── get_proxy_history/
│   │   ├── parse_scan_issues/
│   │   ├── trigger_active_scan/
│   │   ├── replay_modified_request/
│   │   ├── fuzz_parameters/
│   │   ├── test_auth_bypass/
│   │   ├── generate_oob_payload/
│   │   ├── bypass_client_controls/
│   │   ├── delegate_to_agent/      ← Supervisor delega tareas vía HTTP hooks
│   │   ├── save_report/            ← Guarda informe final en ./reports/
│   │   └── clear_target_data/      ← Limpia ChromaDB + reportes por target
│   │
│   ├── agents/                      ← configuración de los 4 agentes
│   │   (prompt drafts, skillFilter, workspace config por agente)
│   │
│   ├── mcp/                         ← MCP server que expone ZAP REST API
│   │   (proyecto TypeScript que conecta OpenClaw ↔ ZAP)
│   │
│   ├── config/
│   │   └── openclaw.json            ← registra pentester/skills/ en OpenClaw
│   │
│   └── docker/
│       ├── docker-compose.yml       ← ZAP daemon + interactsh
│       └── .env.example             ← variables de entorno
│
├── workspace/                       ← ⚙️  WORKSPACE ACTIVO DE OPENCLAW
│   │   (este directorio LO LEE OpenClaw en tiempo de ejecución)
│   ├── SOUL.md                      ← identidad y valores del agente
│   ├── AGENTS.md                    ← comportamiento, memoria, protocolos
│   ├── IDENTITY.md                  ← nombre, emoji, avatar
│   ├── USER.md                      ← info del usuario (Arturo)
│   ├── TOOLS.md                     ← herramientas locales disponibles
│   ├── BOOTSTRAP.md                 ← setup inicial del agente
│   ├── HEARTBEAT.md                 ← tareas periódicas del agente
│   └── labs.txt                     ← URLs de labs de PortSwigger
│
├── openclaw-src/                    ← 📦 CÓDIGO OPENCLAW (NO TOCAR)
│   └── ...                          ← monorepo oficial, no modificar
│
├── Dockerfile                       ← imagen Docker de OpenClaw
└── docker-compose.yml               ← orquestación de OpenClaw
                                        (distinto de pentester/docker/!)
```

---

## 5. Patrón de una skill (IMPORTANTE)

Las skills de OpenClaw son **carpetas con un `SKILL.md`**, no ficheros TypeScript sueltos.

```
mi_skill/
├── SKILL.md          ← OBLIGATORIO: frontmatter YAML + instrucciones markdown
└── scripts/          ← OPCIONAL: helpers Python/Bash que la skill puede invocar
    └── helper.py
```

**Plantilla de `SKILL.md`:**
```markdown
---
name: nombre_de_la_skill
description: "Descripción clara de cuándo usar esta skill y qué hace."
metadata:
  openclaw:
    emoji: "🔍"
    requires:
      env: ["ZAP_API_KEY"]   # vars de entorno necesarias
      bins: ["python3"]       # binarios necesarios
---

# nombre_de_la_skill

Instrucciones detalladas para el agente sobre cómo usar esta skill,
qué parámetros acepta, qué devuelve y cuándo usarla.
```

**Las skills se registran en:** `pentester/config/openclaw.json`

---

## 6. Reglas de trabajo

1. Actualizar `PROJECT/PROGRESS.md` al final de cada sesión
2. Guardar log de sesión en `PROJECT/sessions/YYYY-MM-DD.md`
3. **No tocar `openclaw-src/`** sin entender el impacto
4. Todo código nuevo va en `pentester/`
5. Consultar `PROJECT/ARCHITECTURE.md` antes de decisiones técnicas
6. Al implementar una skill: editar el `SKILL.md` + añadir scripts si hace falta
7. Marcar skills como ✅ en `PROJECT/skills/index.md` cuando se completen

---

## 7. Diferencia entre los dos docker-compose

| Archivo | Para qué sirve |
|---|---|
| `docker-compose.yml` (raíz) | Levantar **OpenClaw** (gateway + agentes) |
| `pentester/docker/docker-compose.yml` | Levantar **ZAP daemon + interactsh** |

Para desarrollo: levantar primero `pentester/docker/`, luego OpenClaw.
