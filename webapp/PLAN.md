# OpenClaw Pentester — Web Management Portal

> **Plan maestro de desarrollo.** Leer antes de tocar cualquier archivo del directorio `webapp/`.

---

## ¿Qué es esta web?

Un portal de gestión centralizado para la plataforma OpenClaw Pentester. Permite a Arturo (y su equipo) gestionar todas las auditorías de seguridad web realizadas por los cuatro agentes autónomos, visualizar hallazgos, generar informes profesionales en Word y monitorizar el estado del sistema en tiempo real.

El portal **no reemplaza** la lógica de los agentes — se sienta encima de ella como capa de gestión y presentación.

---

## Stack tecnológico definitivo

| Capa | Tecnología | Justificación |
|---|---|---|
| **Framework web** | Next.js 15 (App Router) | SSR + API routes en un solo proyecto; TypeScript nativo |
| **UI / Componentes** | shadcn/ui + Tailwind CSS 3 | Componentes accesibles, sin CSS custom, consistencia visual |
| **Icons** | Lucide React | Ya incluido en shadcn/ui |
| **Base de datos** | SQLite + Drizzle ORM | Sin infraestructura extra; JSON embebido para datos de auditoría |
| **Auth** | Auth.js (NextAuth v5) | Sesiones JWT + soporte futuro OAuth/2FA |
| **Real-time** | Server-Sent Events (SSE) | Estado de agentes sin WebSockets; más simple, más resiliente |
| **HTTP cliente** | Fetch nativo + SWR | Para queries a la API interna y polling de estado |
| **Generación Word** | Script Python vía API route | Reutiliza la skill `save_report` ya implementada |
| **Validación** | Zod | Validación de formularios + API |
| **Gestor paquetes** | pnpm | Consistente con el resto del proyecto |
| **Tests** | Vitest + Testing Library | Tests unitarios de componentes y lógica de API |

---

## Integración con el sistema existente

```
Portal Web (Next.js)
     │
     ├── /api/agents/*     ←→   OpenClaw Gateway (localhost:3000)
     │                              ├── Supervisor (port 3001)
     │                              ├── Explorer   (port 3002)
     │                              ├── Analyst    (port 3003)
     │                              └── Exploiter  (port 3004)
     │
     ├── /api/findings/*   ←→   ChromaDB (volumen Docker pentest-db)
     │                              via scripts Python ya existentes
     │
     ├── /api/reports/*    ←→   skill save_report (pentester/skills/)
     │                              genera .docx vía python3
     │
     └── SQLite local           Metadata: users, audits, sessions, settings
```

---

## Módulos de la aplicación

| # | Módulo | Descripción | Agente de desarrollo |
|---|---|---|---|
| 1 | **Auth & Seguridad** | Login, sesiones, RBAC, rate limiting | `AGENT_1_AUTH` |
| 2 | **Backend API** | Rutas Next.js API, DB schema, integración OpenClaw | `AGENT_2_BACKEND` |
| 3 | **Scaffold Frontend** | Setup Next.js, layout, sidebar, routing base | `AGENT_3_FRONTEND` |
| 4 | **Dashboard** | Stats, resumen de auditorías, estado agentes | `AGENT_4_DASHBOARD` |
| 5 | **Gestión de Auditorías** | CRUD auditorías, renombrar, filtrar, estado | `AGENT_5_AUDITS` |
| 6 | **Detalle Auditoría & Findings** | Hallazgos, severidad, evidencias, HITL review | `AGENT_6_FINDINGS` |
| 7 | **Generación de Informes** | Informe Word, plantillas, descarga | `AGENT_7_REPORTS` |
| 8 | **Monitor de Agentes** | Estado real-time de los 4 agentes vía SSE | `AGENT_8_MONITOR` |
| 9 | **Perfil & Configuración** | Perfil usuario, API keys, preferencias, tema | `AGENT_9_SETTINGS` |

---

## Estructura de directorios del portal

```
webapp/
├── PLAN.md                        ← 👈 ESTE ARCHIVO
├── specs/                         ← Especificaciones por módulo
│   ├── 01_STACK.md
│   ├── 02_AUTH.md
│   ├── 03_API.md
│   ├── 04_DASHBOARD.md
│   ├── 05_AUDITS.md
│   ├── 06_FINDINGS.md
│   ├── 07_REPORTS.md
│   ├── 08_AGENTS_MONITOR.md
│   └── 09_USER_SETTINGS.md
│
├── tasks/                         ← Instrucciones para agentes de desarrollo
│   ├── AGENT_1_AUTH.md
│   ├── AGENT_2_BACKEND.md
│   ├── AGENT_3_FRONTEND.md
│   ├── AGENT_4_DASHBOARD.md
│   ├── AGENT_5_AUDITS.md
│   ├── AGENT_6_FINDINGS.md
│   ├── AGENT_7_REPORTS.md
│   ├── AGENT_8_MONITOR.md
│   └── AGENT_9_SETTINGS.md
│
└── src/                           ← Código fuente (se crea durante desarrollo)
    ├── app/                       ← Next.js App Router
    │   ├── (auth)/
    │   │   └── login/
    │   ├── (dashboard)/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx           ← Dashboard
    │   │   ├── audits/
    │   │   │   ├── page.tsx       ← Lista auditorías
    │   │   │   └── [id]/
    │   │   │       ├── page.tsx   ← Detalle auditoría
    │   │   │       └── report/
    │   │   │           └── page.tsx
    │   │   ├── agents/
    │   │   │   └── page.tsx       ← Monitor agentes
    │   │   └── settings/
    │   │       └── page.tsx
    │   └── api/
    │       ├── auth/[...nextauth]/
    │       ├── audits/
    │       ├── findings/
    │       ├── agents/
    │       ├── reports/
    │       └── sse/               ← Server-Sent Events
    ├── components/
    │   ├── ui/                    ← shadcn/ui base
    │   ├── layout/                ← Sidebar, Topbar, Shell
    │   ├── audits/
    │   ├── findings/
    │   ├── agents/
    │   └── reports/
    ├── lib/
    │   ├── auth.ts
    │   ├── db/
    │   │   ├── schema.ts          ← Drizzle schema
    │   │   └── index.ts
    │   ├── openclaw.ts            ← Cliente HTTP para OpenClaw gateway
    │   ├── chromadb.ts            ← Cliente ChromaDB para findings
    │   └── validations/           ← Esquemas Zod
    └── types/
        └── index.ts
```

---

## Orden de desarrollo (por dependencias)

```
1. AGENT_1_AUTH       → Base de autenticación (prerequisito de todo)
2. AGENT_2_BACKEND    → API routes + DB schema (prerequisito del frontend)
3. AGENT_3_FRONTEND   → Scaffold, layout, design system
      ↓ (paralelo a partir de aquí)
4a. AGENT_4_DASHBOARD    ─┐
4b. AGENT_5_AUDITS        ├── Dependen de API + Frontend scaffold
4c. AGENT_8_MONITOR       │
4d. AGENT_9_SETTINGS     ─┘
5. AGENT_6_FINDINGS   → Depende de Audits
6. AGENT_7_REPORTS    → Depende de Findings + skill save_report
```

---

## Capas de seguridad

1. **Autenticación** — Auth.js con JWT httpOnly cookies
2. **Autorización RBAC** — Roles: `admin`, `analyst`, `viewer`
3. **Rate limiting** — 100 req/min por IP en rutas de API
4. **CORS** — Solo orígenes del portal web
5. **Helmet.js** — Headers de seguridad HTTP (CSP, HSTS, etc.)
6. **Validación de inputs** — Zod en todas las rutas de API
7. **HTTPS** — Certificado auto-firmado en dev; prod vía reverse proxy (nginx/caddy)
8. **Audit log** — Registro de todas las acciones de usuario en SQLite
9. **API Keys** — Para acceso programático con scopes limitados
10. **2FA** — TOTP opcional (Auth.js + otplib)

---

## Variables de entorno del portal

```env
# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:4000

# Base de datos
DATABASE_URL=file:./webapp.db

# OpenClaw
OPENCLAW_GATEWAY_URL=http://localhost:3000
OPENCLAW_SUPERVISOR_URL=http://localhost:3001
OPENCLAW_EXPLORER_URL=http://localhost:3002
OPENCLAW_ANALYST_URL=http://localhost:3003
OPENCLAW_EXPLOITER_URL=http://localhost:3004

# ChromaDB (findings)
CHROMADB_HOST=localhost
CHROMADB_PORT=8000
CHROMADB_COLLECTION=pentest_findings

# ZAP (para consultas directas opcionales)
ZAP_BASE_URL=http://localhost:8080
ZAP_API_KEY=...

# Portal
PORTAL_PORT=4000
```

---

## Convenciones de código

- **TypeScript estricto** — `strict: true` en tsconfig
- **Componentes Server por defecto** — Solo `"use client"` cuando sea necesario
- **Carpetas en kebab-case**, archivos en `kebab-case.tsx`
- **API routes** — Retornan siempre `{ data, error, meta }` o `{ success, message }`
- **Error handling** — Try/catch en todas las rutas; errores tipados con Zod
- **Comentarios en español** — Consistente con el resto del proyecto
